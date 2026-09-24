import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryCategory } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/translations';
import { 
  Boxes, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Calendar,
  Layers
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast, exportCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');

  // Form states
  const [itemName, setItemName] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState(db.sectors[0]?.id || '');
  const [category, setCategory] = useState<InventoryCategory>('feed');
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('Kg');
  const [unitCost, setUnitCost] = useState('65');
  const [minReorderLevel, setMinReorderLevel] = useState('20');
  const [location, setLocation] = useState('Central Feed Warehouse');

  const filteredItems = db.inventory.filter((item) => {
    const nameStr = item.itemName || item.name || '';
    const locStr = item.location || '';
    const matchesSearch =
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sectorFilter === 'all' || item.sectorId === sectorFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesSector && matchesCategory;
  });

  const lowStockItems = db.inventory.filter((item) => (item.quantity ?? 0) <= item.minReorderLevel);
  const totalInventoryValuation = db.inventory.reduce((sum, item) => sum + (item.quantity ?? 0) * item.unitCost, 0);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const numQty = parseFloat(quantity);
    const numCost = parseFloat(unitCost);
    if (!itemName || isNaN(numQty) || isNaN(numCost)) {
      showToast('Please fill all required item fields');
      return;
    }

    const newItem: InventoryItem = {
      id: `inv-item-${Date.now()}`,
      itemName,
      sectorId: selectedSectorId,
      category,
      quantity: numQty,
      unit,
      unitCost: numCost,
      minReorderLevel: parseFloat(minReorderLevel) || 10,
      location: location || 'Warehouse',
      lastRestockedDate: new Date().toISOString().slice(0, 10),
    };

    updateDb((prev) => ({
      ...prev,
      inventory: [newItem, ...prev.inventory],
    }));

    logAudit('ADD_INVENTORY', `Added new inventory stock item: ${itemName} (${numQty} ${unit})`);
    setIsAddModalOpen(false);
    setItemName('');
    showToast(`Inventory item "${itemName}" created!`);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    const num = parseFloat(adjustQty);
    if (isNaN(num) || num <= 0) return;

    const currentStock = adjustItem.quantity ?? 0;
    const newQty = adjustType === 'in' ? currentStock + num : Math.max(0, currentStock - num);

    updateDb((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) =>
        i.id === adjustItem.id
          ? {
              ...i,
              quantity: newQty,
              lastRestockedDate: adjustType === 'in' ? new Date().toISOString().slice(0, 10) : i.lastRestockedDate,
            }
          : i
      ),
    }));

    logAudit(
      'ADJUST_STOCK',
      `Stock ${adjustType.toUpperCase()} for ${adjustItem.itemName || adjustItem.name}: ${num} ${adjustItem.unit}. New balance: ${newQty} ${adjustItem.unit}`
    );

    setAdjustItem(null);
    setAdjustQty('');
    showToast(`Stock updated for ${adjustItem.itemName || adjustItem.name}!`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Item Name',
      'Sector',
      'Category',
      'Current Quantity',
      'Unit',
      'Unit Cost (BDT)',
      'Total Value (BDT)',
      'Reorder Level',
      'Location',
      'Last Restocked',
    ];

    const rows = filteredItems.map((item) => {
      const sec = db.sectors.find((s) => s.id === item.sectorId);
      const qty = item.quantity ?? 0;
      return [
        item.itemName || item.name || 'Item',
        sec?.name || 'General',
        item.category,
        qty,
        item.unit,
        item.unitCost,
        qty * item.unitCost,
        item.minReorderLevel,
        item.location || 'Warehouse',
        item.lastRestockedDate || item.lastRestocked || '',
      ];
    });

    exportCSV('Inventory_Stock_Ledger', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.inventory}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'খামারের খাদ্য, বীজ, সার, ওষুধ ও উৎপাদিত পণ্যের ডিজিটাল গুদাম খতিয়ান' 
              : 'Warehouse stock tracking, feeds, seeds, bio-fertilizers & low-stock alerts'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Low Stock Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900">
                {lowStockItems.length} Stock Item(s) at or below Reorder Level!
              </p>
              <p className="text-[11px] text-rose-700">
                {lowStockItems.map((i) => `${i.itemName} (${i.quantity} ${i.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-rose-800 shrink-0">Action Required</span>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Inventory Valuation</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalInventoryValuation, language)}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">{db.inventory.length} Tracked Line Items</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Low Stock Alerts</span>
          <span className={`text-xl font-bold tabular-nums ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {lowStockItems.length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Below minimum buffer limit</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Primary Warehouse</span>
          <span className="text-xl font-bold text-slate-900">Central Gazipur Depot</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Temperature & pest-controlled</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">{t.sector}</th>
                <th className="py-3 px-4">{t.category}</th>
                <th className="py-3 px-4 text-right">In Stock Qty</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Reorder Threshold</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const sector = db.sectors.find((s) => s.id === item.sectorId);
                const qty = item.quantity ?? 0;
                const isLow = qty <= item.minReorderLevel;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {item.itemName || item.name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {language === 'bn' ? sector?.nameBn || sector?.name : sector?.name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap capitalize">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    <td className={`py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap ${isLow ? 'text-rose-700' : 'text-slate-900'}`}>
                      {formatNumber(qty, language)} {item.unit}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                      {formatCurrency(item.unitCost, language)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(qty * item.unitCost, language)}
                    </td>

                    <td className="py-3 px-4 text-center tabular-nums whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.minReorderLevel} {item.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.location}</td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setAdjustItem(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                      >
                        Stock In/Out
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Adjust Stock: {adjustItem.itemName}</h3>
              <button onClick={() => setAdjustItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border ${
                      adjustType === 'in'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    + Stock IN (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border ${
                      adjustType === 'out'
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    - Stock OUT (Used)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity ({adjustItem.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex justify-between">
                <span>Current Quantity:</span>
                <span className="font-bold text-slate-900">{adjustItem.quantity} {adjustItem.unit}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Inventory Stock Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Organic Mustard Oil Cake Fertilizer"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sector</label>
                  <select
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {db.sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white capitalize"
                  >
                    <option value="feed">Feed</option>
                    <option value="seeds">Seeds</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="medicine">Medicine</option>
                    <option value="equipment">Equipment</option>
                    <option value="packaging">Packaging</option>
                    <option value="produce">Harvest Produce</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit Cost (৳ BDT)</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Minimum Reorder Level</label>
                  <input
                    type="number"
                    value={minReorderLevel}
                    onChange={(e) => setMinReorderLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Warehouse Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
