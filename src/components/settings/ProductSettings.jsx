import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, deleteDoc, getDoc } from 'firebase/firestore'; // Import getDoc
import { Plus, Trash2, Search, Package, ArrowLeft } from 'lucide-react';
import { db, appId } from '../../api/firebase';
import { useAppContext } from '../../context/AppContext';
import { logAuditEvent } from '../../api/auditlog'; // Import the audit log function

const ProductSettings = () => {
    const { products, isLoading } = useAppContext();
    const [newProductName, setNewProductName] = useState('');
    const [newProductHsn, setNewProductHsn] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const addProductInputRef = useRef(null);

    const productsCollectionPath = `/artifacts/${appId}/products`;

    useEffect(() => {
        addProductInputRef.current?.focus();
    }, []);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setError('');
        if (!newProductName.trim()) {
            setError("Product name cannot be empty.");
            return;
        }
        if (products.some(p => p.name.toLowerCase() === newProductName.trim().toLowerCase())) {
            setError("This product already exists.");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, productsCollectionPath), {
                name: newProductName.trim(),
                hsn: newProductHsn.trim()
            });
            logAuditEvent('CREATE_PRODUCT', {
                productId: docRef.id,
                productName: newProductName.trim(),
            });
            setNewProductName('');
            setNewProductHsn('');
        } catch (err) {
            console.error("Error adding product: ", err);
            setError("Failed to add product.");
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            const productRef = doc(db, productsCollectionPath, productId);
            const productDoc = await getDoc(productRef);
            if (productDoc.exists()) {
                const productName = productDoc.data().name;
                await deleteDoc(productRef);
                logAuditEvent('DELETE_PRODUCT', {
                    productId: productId,
                    productName: productName
                });
            }
        } catch (err) {
            console.error("Error deleting product: ", err);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <p>Loading products...</p>;

    return (
        <div>
            <div className="mb-6">
                <Link to="/settings" className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Settings
                </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start">
                    <div className="p-2 bg-gray-100 rounded-lg mr-4">
                        <Package size={24} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Products & Services</h2>
                        <p className="text-gray-500 mt-1 text-sm">Manage your reusable products to speed up invoice creation.</p>
                    </div>
                </div>

                <div className="border-t my-6"></div>

                <form onSubmit={handleAddProduct} className="mb-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <input
                            ref={addProductInputRef}
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            placeholder="Enter new product or service name"
                            className="form-input-create flex-grow"
                        />
                        <input
                            type="text"
                            value={newProductHsn}
                            onChange={(e) => setNewProductHsn(e.target.value)}
                            placeholder="HSN/SAC Code"
                            className="form-input-create w-48"
                        />
                    </div>
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold w-full">
                        <Plus size={18} />
                        <span className="ml-2">Add Product</span>
                    </button>
                </form>
                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                <div className="mt-4 pt-4 border-t">
                     <input
                        type="text"
                        placeholder="Search existing products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input-search w-full max-w-sm mb-4"
                    />
                    <div className="space-y-2">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300">
                                <div>
                                    <span className="font-medium text-gray-700">{product.name}</span>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">HSN/SAC: {product.hsn || 'N/A'}</p>
                                </div>
                                <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-md">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSettings;