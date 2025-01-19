'use client';

import React, { useState, useEffect, memo } from 'react';
import { Plus, Search, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiBaseUrl, backendUrl } from '@/config';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/inventory/get_inventory`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/inventory/delete_from_inventory/${productId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.ok) {
          fetchProducts();
        } else {
          setError('Failed to delete product');
        }
      } catch (error) {
        setError(`Failed to delete product, ${error}`);
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={20} />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <MemoizedProductForm
                onSuccess={fetchProducts}
                onClose={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {product.images && product.images.length > 0 ? (
                          <div className="flex space-x-2">
                            {product.images.map((image, index) => (
                              <img
                                key={index}
                                src={`${backendUrl}/${image.replace('./', '')}`}
                                alt={`${product.name} - Image ${index + 1}`}
                                className="h-16 w-16 object-cover rounded-md cursor-pointer"
                                onClick={() => setSelectedImage(`${backendUrl}/${image.replace('./', '')}`)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="h-16 w-16 bg-gray-100 flex items-center justify-center rounded-md">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Badge
                            variant={
                              product.quantity <= product.low_stock_threshold
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {product.quantity}
                          </Badge>
                          {product.quantity <= product.low_stock_threshold && (
                            <AlertTriangle size={16} className="ml-2 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">₦{product.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsEditDialogOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedProduct && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <MemoizedEditProductForm
                product={selectedProduct}
                onSuccess={fetchProducts}
                onClose={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Modal for Image */}
        {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Image</DialogTitle>
          </DialogHeader>
          <img
            src={selectedImage}
            alt="Product"
            className="w-full h-auto rounded-md shadow-md"
          />
          <Button
            className="mt-4 w-full"
            onClick={() => setSelectedImage(null)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      )}

      </div>
    </DashboardLayout>
  );
};

const ProductForm = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    quantity: '',
    price: '',
    category: '',
    description: '',
    low_stock_threshold: '10',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert('You can upload a maximum of 3 images');
      return;
    }
    setSelectedFiles(files);
    setFilePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSubmit = new FormData();

    // Append formData
    for (let key in formData) {
      if (key === "quantity" || key === "low_stock_threshold") {
        formDataToSubmit.append(key, parseInt(formData[key], 10));
      } else if (key === "price") {
        formDataToSubmit.append(key, parseFloat(formData[key]));
      } else {
        formDataToSubmit.append(key, formData[key]);
      }
    }

    // Append files
    if (Array.isArray(selectedFiles)) {
      selectedFiles.forEach((file) => {
        if (file instanceof File) {
          formDataToSubmit.append('images', file);
        } else {
          console.error("Invalid file:", file);
        }
      });
    }

    try {
      const response = await fetch(`${apiBaseUrl}/inventory/add_to_inventory`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSubmit,
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: '',
          sku: '',
          quantity: '',
          price: '',
          category: '',
          description: '',
          low_stock_threshold: '10',
        });
        setSelectedFiles([]);
        setFilePreviews([]);
        onClose();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      alert(`Failed to add product, ${error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">SKU</label>
          <Input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <Input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
        <Input
          type="number"
          value={formData.low_stock_threshold}
          onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Images</label>
        <Input type="file" multiple accept="image/*" onChange={handleFileChange} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          {filePreviews.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Preview ${index + 1}`}
              className="h-24 w-24 object-cover rounded-md shadow-md"
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add Product
      </Button>
    </form>
  );
};

const EditProductForm = ({ product, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku,
    quantity: product.quantity.toString(),
    price: product.price.toString(),
    category: product.category || '',
    description: product.description || '',
    low_stock_threshold: product.low_stock_threshold.toString(),
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState(
    product.images.map(img => `${backendUrl}/${img.replace('./', '')}`)
  );
  const [existingImages, setExistingImages] = useState(product.images);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + filePreviews.length > 3) {
      alert("You can upload a maximum of 3 images");
      return;
    }

    const newFilePreviews = files.map((file) => URL.createObjectURL(file));
    
    setSelectedFiles(prevFiles => {
      const updatedFiles = [...prevFiles, ...files];
      return updatedFiles;
    });

    setFilePreviews(prevPreviews => {
      const updatedPreviews = [...prevPreviews, ...newFilePreviews];
      return updatedPreviews;
    });

    // Clear input value
    e.target.value = null;
  };

  const handleRemoveImage = (indexToRemove) => {
    // Check if the removed image is an existing image
    const isExistingImage = indexToRemove < existingImages.length;

    if (isExistingImage) {
      // Remove from existing images
      setExistingImages(prev => prev.filter((_, index) => index !== indexToRemove));
      setFilePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    } else {
      // Adjust index for newly added files
      const adjustedFileIndex = indexToRemove - existingImages.length;
      setSelectedFiles(prev => prev.filter((_, index) => index !== adjustedFileIndex));
      setFilePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    }
    
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSubmit = new FormData();

    // Append form fields
    for (let key in formData) {
      if (key === "quantity" || key === "low_stock_threshold") {
        formDataToSubmit.append(key, parseInt(formData[key], 10));
      } else if (key === "price") {
        formDataToSubmit.append(key, parseFloat(formData[key]));
      } else {
        formDataToSubmit.append(key, formData[key]);
      }
    }

    // Append existing images that weren't removed
    formDataToSubmit.append('existing_images', JSON.stringify(existingImages));

    // Append new files
    selectedFiles.forEach((file) => {
      formDataToSubmit.append('images', file);
    });

    try {
      const response = await fetch(`${apiBaseUrl}/inventory/update_product/${product.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSubmit,
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.detail);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">SKU</label>
          <Input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <Input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
        <Input
          type="number"
          value={formData.low_stock_threshold}
          onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Images</label>
        <Input type="file" multiple accept="image/*" onChange={handleFileChange} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          {filePreviews.map((src, index) => (
            <div key={index} className="relative">
              <img
                src={src}
                alt={`Preview ${index + 1}`}
                className="h-24 w-24 object-cover rounded-md shadow-md"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Update Product
      </Button>
    </form>
  );
};

const MemoizedEditProductForm = memo(EditProductForm);

const MemoizedProductForm = memo(ProductForm);

export default InventoryManagement;
