import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Search } from 'lucide-react';
import { db, appId } from '../api/firebase';
import { useAppContext } from '../context/AppContext';

function ProductMaster() {
    const { products, isLoading } = useAppContext();
    const [newProductName, setNewProductName] = useState('');
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
            await addDoc(collection(db, productsCollectionPath), { name: newProductName.trim() });
            setNewProductName('');
        } catch (err) {
            console.error("Error adding product: ", err);
            setError("Failed to add product.");
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            await deleteDoc(doc(db, productsCollectionPath, productId));
        } catch (err) {
            console.error("Error deleting product: ", err);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <p>Loading products...</p>;

    return (
        <div className="bg-card p-8 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
                <h2 className="text-2xl font-bold text-text-primary">Products & Services</h2>
                <div className="relative flex-grow md:max-w-xs">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input-search w-full"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>

            <form onSubmit={handleAddProduct} className="mb-6 flex items-center gap-2">
                <input
                    ref={addProductInputRef}
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Enter new product or service name"
                    className="form-input-create flex-grow"
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold">
                    <Plus size={18} className="mr-2" /> Add
                </button>
            </form>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

            <div className="space-y-2">
                {filteredProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                        <span className="font-medium text-text-primary">{product.name}</span>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-md">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProductMaster;