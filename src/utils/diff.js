/**
 * Compares two objects and returns a detailed log of changes,
 * ignoring a predefined set of keys.
 * @param {object} original - The original object.
 * @param {object} updated - The updated object.
 * @returns {object} - An object detailing the changes.
 */
export const getObjectChanges = (original, updated) => {
    const changes = {};

    const keysToIgnore = [
        'grossTotal', 'totalDiscount', 'taxableTotal',
        'totalGst', 'total', 'igst', 'cgst', 'sgst',
        'createdAt', 'updatedAt',
    ];

    if (!original || !updated) return {};

    const allKeys = [...new Set([...Object.keys(original), ...Object.keys(updated)])];

    for (const key of allKeys) {
        if (keysToIgnore.includes(key)) {
            continue;
        }

        const originalValue = original[key];
        const updatedValue = updated[key];

        // --- NEW: Detailed array comparison logic ---
        if (Array.isArray(originalValue) && Array.isArray(updatedValue)) {
            const arrayChanges = {};
            const maxLength = Math.max(originalValue.length, updatedValue.length);

            for (let i = 0; i < maxLength; i++) {
                const itemOriginal = originalValue[i];
                const itemUpdated = updatedValue[i];

                // Case 1: Item was removed
                if (itemUpdated === undefined) {
                    arrayChanges[`item_${i + 1}`] = { change: 'REMOVED', data: itemOriginal.description || 'N/A' };
                    continue;
                }
                // Case 2: Item was added
                if (itemOriginal === undefined) {
                    arrayChanges[`item_${i + 1}`] = { change: 'ADDED', data: itemUpdated.description || 'N/A' };
                    continue;
                }
                // Case 3: Item was modified
                const itemChanges = getObjectChanges(itemOriginal, itemUpdated);
                if (Object.keys(itemChanges).length > 0) {
                    arrayChanges[`item_${i + 1} (${itemUpdated.description})`] = itemChanges;
                }
            }

            if (Object.keys(arrayChanges).length > 0) {
                changes[key] = arrayChanges;
            }
        }
        // Handle nested objects recursively
        else if (typeof originalValue === 'object' && originalValue !== null && typeof updatedValue === 'object' && updatedValue !== null) {
            const nestedChanges = getObjectChanges(originalValue, updatedValue);
            if (Object.keys(nestedChanges).length > 0) {
                changes[key] = nestedChanges;
            }
        }
        // Handle simple value changes
        else if (String(originalValue) !== String(updatedValue)) { // Use string comparison to handle type differences (e.g., number vs string)
            changes[key] = {
                from: originalValue === undefined ? '(not set)' : originalValue,
                to: updatedValue === undefined ? '(not set)' : updatedValue,
            };
        }
    }

    return changes;
};