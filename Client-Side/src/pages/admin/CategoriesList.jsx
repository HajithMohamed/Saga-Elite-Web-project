import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_V1_URL as API_BASE } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';

const CategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      setCategories(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Categories</h2>
        <div>
          <button
            onClick={() => navigate('/admin/categories/new')}
            className="px-3 py-2 bg-[#D4AF37] text-black rounded"
          >
            New Category
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c._id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-400">/{c.slug}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/admin/categories/${c._id}`} className="text-sm text-[#d4af37]">Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesList;
