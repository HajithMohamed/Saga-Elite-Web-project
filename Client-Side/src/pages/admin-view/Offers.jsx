import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import { API_V1_URL as API_BASE } from '@/lib/api';
import { formatLkr } from '@/utils/currency';
import { Tag, AlertTriangle, Search, Plus, Trash2, Calendar, CheckCircle } from 'lucide-react';

const AdminOffers = () => {
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'aging', 'create'
  const [offers, setOffers] = useState([]);
  const [agingStock, setAgingStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercent: 10,
    productIds: '',
    badgeText: '',
    endsAt: ''
  });

  const fetchOffers = async () => {
    try {
      setLoading(true);
      // Fetch active offers
      const res = await axios.get(`${API_BASE}/offers/admin`, {
        withCredentials: true
      }).catch(() => ({ data: { data: { offers: [] } } })); // Fallback if endpoint not ready
      setOffers(res.data?.data?.offers || []);

      // Fetch aging stock (mock/placeholder endpoint or real if exists)
      const agingRes = await axios.get(`${API_BASE}/admin/products/aging`, {
        withCredentials: true
      }).catch(() => ({ data: { data: { products: [] } } })); // Fallback
      
      setAgingStock(agingRes.data?.data?.products || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load offers data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        productIds: formData.productIds.split(',').map(id => id.trim()).filter(Boolean),
        startDate: new Date().toISOString(), // Starting now for simplicity
        endsAt: new Date(formData.endsAt).toISOString()
      };

      await axios.post(`${API_BASE}/offers/admin`, payload, { withCredentials: true });
      toast({ title: 'Success', description: 'Offer created successfully' });
      setFormData({ title: '', description: '', discountPercent: 10, productIds: '', badgeText: '', endsAt: '' });
      setActiveTab('active');
      fetchOffers();
    } catch (err) {
      toast({ title: 'Error', description: 'Could not create offer', variant: 'destructive' });
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await axios.delete(`${API_BASE}/offers/admin/${id}`, { withCredentials: true });
      toast({ title: 'Deleted', description: 'Offer removed successfully' });
      fetchOffers();
    } catch (err) {
      toast({ title: 'Error', description: 'Could not delete offer', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 text-[#e5e2e1] max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#2a2a2a]">
        <div>
          <h1 className="font-display text-4xl text-[#FAF7F2] uppercase tracking-widest">Offers & Clearances</h1>
          <p className="font-sans text-sm text-[#99907c] mt-2">Manage promotions and handle aging inventory.</p>
        </div>
        <button 
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-2 bg-[#f2ca50] text-[#0a0a0a] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-[#ffe088] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Offer
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors border ${activeTab === 'active' ? 'bg-[#131313] border-[#f2ca50] text-[#f2ca50]' : 'border-[#2a2a2a] text-[#888] hover:text-[#e5e2e1]'}`}
        >
          Active Offers
        </button>
        <button 
          onClick={() => setActiveTab('aging')}
          className={`flex items-center gap-2 px-6 py-3 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors border ${activeTab === 'aging' ? 'bg-[#131313] border-[#ffb4ab] text-[#ffb4ab]' : 'border-[#2a2a2a] text-[#888] hover:text-[#e5e2e1]'}`}
        >
          <AlertTriangle className="w-4 h-4" /> Aging Stock Suggestions
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-t-2 border-[#f2ca50] animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB: ACTIVE OFFERS */}
          {activeTab === 'active' && (
            <div className="bg-[#131313] border border-[#2a2a2a] rounded-sm overflow-hidden">
              <div className="p-6 border-b border-[#2a2a2a]">
                <h2 className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Currently Running
                </h2>
              </div>
              {offers.length === 0 ? (
                <div className="p-12 text-center text-[#888] font-mono text-xs uppercase tracking-widest">
                  No active offers.
                </div>
              ) : (
                <div className="divide-y divide-[#2a2a2a]">
                  {offers.map(offer => (
                    <div key={offer._id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-2xl text-[#FAF7F2] uppercase">{offer.title}</h3>
                          {offer.badgeText && (
                            <span className="bg-[#ffb4ab] text-[#0a0a0a] text-[10px] font-bold px-2 py-0.5">{offer.badgeText}</span>
                          )}
                        </div>
                        <p className="text-sm text-[#99907c]">{offer.description}</p>
                        <div className="flex items-center gap-4 mt-4 font-mono text-[10px] uppercase tracking-widest text-[#888]">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#f2ca50]" /> Ends: {new Date(offer.endsAt).toLocaleDateString()}</span>
                          <span>|</span>
                          <span className="text-[#f2ca50]">{offer.discountPercent}% OFF</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteOffer(offer._id)}
                        className="text-red-500 hover:text-red-400 p-2 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: AGING STOCK */}
          {activeTab === 'aging' && (
            <div className="bg-[#131313] border border-[#2a2a2a] rounded-sm p-6">
              <div className="mb-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-[#ffb4ab] flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Clearance Recommendations
                </h2>
                <p className="text-sm text-[#99907c]">Inventory older than 90 days with low movement. Recommended for flash sales.</p>
              </div>
              
              {agingStock.length === 0 ? (
                <div className="p-12 text-center text-[#888] font-mono text-xs uppercase tracking-widest border border-dashed border-[#2a2a2a]">
                  Inventory is moving healthy. No aging stock detected.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agingStock.map(item => (
                    <div key={item._id} className="border border-[#2a2a2a] bg-[#0a0a0a] p-4 flex gap-4">
                      {item.images?.[0]?.url && <img src={item.images[0].url} alt={item.name} className="w-16 h-20 object-cover" />}
                      <div className="flex-1">
                        <h4 className="font-sans text-sm text-[#e5e2e1] truncate">{item.name}</h4>
                        <p className="text-xs text-[#888] mt-1">Stock: {item.totalStock}</p>
                        <p className="text-xs text-[#ffb4ab] mt-1">Idle: {item.daysIdle || '90+'} Days</p>
                        <button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, productIds: item._id, title: `Clearance: ${item.name}`, discountPercent: 30, badgeText: 'CLEARANCE' }));
                            setActiveTab('create');
                          }}
                          className="mt-3 text-[10px] text-[#f2ca50] font-mono uppercase tracking-widest hover:underline"
                        >
                          Create Offer →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CREATE OFFER */}
          {activeTab === 'create' && (
            <div className="bg-[#131313] border border-[#f2ca50]/30 rounded-sm p-6 md:p-8">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] mb-8 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create New Offer
              </h2>
              
              <form onSubmit={handleCreateOffer} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">Offer Title</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required
                           className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#FAF7F2] p-3 text-sm focus:border-[#f2ca50] outline-none" placeholder="e.g. Flash Sale" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">Badge Text</label>
                    <input type="text" value={formData.badgeText} onChange={e => setFormData({...formData, badgeText: e.target.value})} 
                           className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#FAF7F2] p-3 text-sm focus:border-[#f2ca50] outline-none" placeholder="e.g. 20% OFF" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2}
                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#FAF7F2] p-3 text-sm focus:border-[#f2ca50] outline-none" placeholder="Details about the offer..."></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">Discount Percentage (%)</label>
                    <input type="number" min="1" max="99" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})} required
                           className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#FAF7F2] p-3 text-sm focus:border-[#f2ca50] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">End Date & Time</label>
                    <input type="datetime-local" value={formData.endsAt} onChange={e => setFormData({...formData, endsAt: e.target.value})} required
                           className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#FAF7F2] p-3 text-sm focus:border-[#f2ca50] outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">Target Product IDs (Comma Separated)</label>
                  <input type="text" value={formData.productIds} onChange={e => setFormData({...formData, productIds: e.target.value})} required
                         className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#FAF7F2] p-3 text-sm focus:border-[#f2ca50] outline-none font-mono" placeholder="id1, id2, id3..." />
                  <p className="text-[10px] text-[#666] mt-2">Paste specific product ObjectIds here. This binds the discount directly to these items.</p>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#f2ca50] text-[#0a0a0a] px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-widest hover:bg-[#ffe088] transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Publish New Offer
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOffers;