# functions/main.py

import os
import base64
import logging
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

import google.oauth2.credentials
import googleapiclient.discovery

from firebase_admin import initialize_app, auth, firestore # Added firestore for optional auth check
from firebase_functions import https_fn, options, params # Keep these

initialize_app()

options.set_global_options(max_instances=10)

BASE64_CLEAN_REGEX = re.compile(r'[^A-Za-z0-9+/=\s]')

@https_fn.on_request(secrets=[
    params.SecretParam("GMAIL_CLIENT_ID"),
    params.SecretParam("GMAIL_CLIENT_SECRET"),
    params.SecretParam("GMAIL_REFRESH_TOKEN")
])
def send_email(req: https_fn.Request) -> https_fn.Response:
    allowed_origin = '*'
    response_headers = {
        'Access-Control-Allow-Origin': allowed_origin,
    }

    if req.method == 'OPTIONS':
        response_headers['Access-Control-Allow-Methods'] = 'POST'
        response_headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response_headers['Access-Control-Max-Age'] = '3600'
        return https_fn.Response("", status=204, headers=response_headers)

    try:
        logging.info("send_email Cloud Function received a request.")

        if not req.is_json:
            logging.warning("Request is not JSON.")
            return https_fn.Response("Request must be JSON", status=400, headers=response_headers)

        data = req.get_json()
        to_email = data.get('to')
        email_subject = data.get('subject')
        email_body = data.get('body')
        attachment_info = data.get('attachment')

        logging.info(f"Received email request: To='{to_email}', Subject='{email_subject}'")

        if not all([to_email, email_subject, email_body]):
            logging.warning("Missing required fields (to, subject, or body).")
            return https_fn.Response("Missing fields: 'to', 'subject', or 'body'", status=400, headers=response_headers)

        GMAIL_CLIENT_ID = os.environ.get("GMAIL_CLIENT_ID")
        GMAIL_CLIENT_SECRET = os.environ.get("GMAIL_CLIENT_SECRET")
        GMAIL_REFRESH_TOKEN = os.environ.get("GMAIL_REFRESH_TOKEN")
        TOKEN_URI = "https://accounts.google.com/o/oauth2/token"
        SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

        creds = google.oauth2.credentials.Credentials(
            None,
            refresh_token=GMAIL_REFRESH_TOKEN,
            token_uri=TOKEN_URI,
            client_id=GMAIL_CLIENT_ID,
            client_secret=GMAIL_CLIENT_SECRET,
            scopes=SCOPES
        )

        gmail_service = googleapiclient.discovery.build('gmail', 'v1', credentials=creds)

        message = MIMEMultipart()
        message['to'] = to_email
        message['from'] = 'me'
        message['subject'] = email_subject

        message.attach(MIMEText(email_body, 'plain'))
        logging.info("Text body attached to email.")

        if attachment_info:
            filename = attachment_info.get('filename', 'attachment.pdf')
            base64_file_data = attachment_info.get('data')
            mime_type = attachment_info.get('mimeType', 'application/octet-stream')

            logging.info(f"Attachment info received: Filename='{filename}', MimeType='{mime_type}'")
            logging.debug(f"Raw Base64 data start: {base64_file_data[:50]}...")

            if base64_file_data:
                try:
                    cleaned_base64_data = BASE64_CLEAN_REGEX.sub('', base64_file_data)
                    if len(cleaned_base64_data) != len(base64_file_data):
                        logging.warning("Invalid characters detected and removed from Base64 data.")

                    decoded_file_data = base64.b64decode(cleaned_base64_data)
                    logging.info("Base64 data successfully decoded.")

                    part = MIMEApplication(
                        decoded_file_data,
                        _subtype=mime_type.split('/')[-1]
                    )
                    part.add_header('Content-Disposition', 'attachment', filename=filename)
                    message.attach(part)
                    logging.info(f"Successfully attached {filename} to email.")
                except Exception as attach_e:
                    logging.error(f"Error during file attachment process: {attach_e}", exc_info=True)
                    logging.error("Attachment might not be included in the email due to this error.")
            else:
                logging.warning("No Base64 data found for attachment, skipping attachment.")
        else:
            logging.info("No attachment info provided in the request.")

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        create_message = {'raw': raw_message}

        response = gmail_service.users().messages().send(userId="me", body=create_message).execute()

        logging.info(f"Email sent successfully with Message ID: {response['id']}")
        return https_fn.Response(f"Email sent successfully with Message ID: {response['id']}", status=200, headers=response_headers)

    except Exception as e:
        logging.error("Email send failed due to an unhandled exception.", exc_info=True)
        return https_fn.Response(f"An error occurred: {e}", status=500, headers=response_headers)


# NEW: Callable Cloud Function for adminDeleteUser
# Callable functions automatically handle CORS and provide auth context (req.auth)
@https_fn.on_call()
def adminDeleteUser(req: https_fn.CallableRequest) -> str: # Return type is typically any JSON-serializable object
    """
    Callable Cloud Function to delete a Firebase user by UID.
    Requires Firebase Admin SDK with authentication privileges.
    Only allows authenticated admin users to call.
    """
    logging.info("adminDeleteUser Callable Function received a request.")

    # 1. Server-Side Authorization: Ensure the caller is authenticated and is an admin
    if not req.auth:
        raise https_fn.CallableException(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="The function must be called while authenticated."
        )

    caller_uid = req.auth.uid
    app_id_from_client = req.auth.token.get('app_id', 'receivabled') # Default to 'receivabled' if not in token

    # Check caller's role in Firestore
    db = firestore.client()
    user_doc_ref = db.collection('artifacts').document(app_id_from_client).collection('users').document(caller_uid)
    user_doc = user_doc_ref.get()

    if not user_doc.exists or user_doc.to_dict().get('role') != 'admin':
        raise https_fn.CallableException(
            code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="Only administrators are allowed to delete users."
        )

    # 2. Get data from client (automatically unwrapped by on_call)
    uid_to_delete = req.data.get('uid')

    if not uid_to_delete:
        raise https_fn.CallableException(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="User ID (uid) is required in the request."
        )

    # 3. Prevent admin from deleting themselves (server-side check as well for robustness)
    if caller_uid == uid_to_delete:
        raise https_fn.CallableException(
            code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="An administrator cannot delete their own user account via this function."
        )

    try:
        auth.delete_user(uid_to_delete)
        logging.info(f"Successfully deleted user: {uid_to_delete} by admin: {caller_uid}")
        return "User deleted successfully" # Callable functions return a dict/string/list directly
    except Exception as e:
        logging.error(f"Error deleting user {uid_to_delete}: {e}", exc_info=True)
        # Catch specific Firebase Auth errors if needed, e.g., auth.UserNotFoundError
        raise https_fn.CallableException(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to delete user: {e}"
        )