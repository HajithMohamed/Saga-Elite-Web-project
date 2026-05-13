import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_V1_URL as API_BASE } from '@/lib/api';

const CategoryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parent, setParent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      const cat = res.data?.data?.find((c) => c._id === id);
      if (cat) {
        setName(cat.name || '');
        setSlug(cat.slug || '');
        setParent(cat.parentCategory || '');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (id) {
        await axios.put(`${API_BASE}/admin/categories/${id}`, { name, slug, parentCategory: parent });
      } else {
        await axios.post(`${API_BASE}/admin/categories`, { name, slug, parentCategory: parent });
      }
      navigate('/admin/categories');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-xl font-bold mb-4">{id ? 'Edit Category' : 'New Category'}</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-3">
        <label className="block text-sm mb-1">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="mb-3">
        <label className="block text-sm mb-1">Slug (optional)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="mb-3">
        <label className="block text-sm mb-1">Parent Category (id)</label>
        <input value={parent} onChange={(e) => setParent(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-[#D4AF37] text-black rounded">Save</button>
        <button onClick={() => navigate('/admin/categories')} className="px-4 py-2 border rounded">Cancel</button>
      </div>
    </div>
  );
};

export default CategoryEditor;
