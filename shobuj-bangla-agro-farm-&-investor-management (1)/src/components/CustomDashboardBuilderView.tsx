import React from 'react';
import { useApp } from '../context/AppContext';
import { DashboardWidgetConfig } from '../types';
import { 
  LayoutDashboard, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles,
  Sliders
} from 'lucide-react';

export const CustomDashboardBuilderView: React.FC = () => {
  const { db, language, t, updateDb, logAudit, showToast } = useApp();

  const widgets = [...db.dashboardWidgets].sort((a, b) => a.order - b.order);

  const handleToggleWidget = (id: string) => {
    updateDb((prev) => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.map((w) =>
        w.id === id ? { ...w, isVisible: !w.isVisible } : w
      ),
    }));
    showToast('Dashboard layout updated!');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const newWidgets = [...widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    // Reassign order
    const updated = newWidgets.map((w, idx) => ({ ...w, order: idx + 1 }));

    updateDb((prev) => ({
      ...prev,
      dashboardWidgets: updated,
    }));

    logAudit('REORDER_DASHBOARD', `Rearranged dashboard widget order`);
    showToast('Widget position moved!');
  };

  const handleToggleWidth = (id: string) => {
    updateDb((prev) => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.map((w) =>
        w.id === id ? { ...w, width: w.width === 'full' ? 'half' : 'full' } : w
      ),
    }));
    showToast('Widget width altered!');
  };

  const handleResetDefaults = () => {
    const defaults: DashboardWidgetConfig[] = [
      { id: 'w-kpi-investment', title: 'Total Investment Raised', titleBn: 'মোট সংগৃহীত বিনিয়োগ', widgetType: 'kpi_card', isVisible: true, order: 1, width: 'quarter' },
      { id: 'w-kpi-revenue', title: 'Gross Revenue', titleBn: 'মোট রাজস্ব আয়', widgetType: 'kpi_card', isVisible: true, order: 2, width: 'quarter' },
      { id: 'w-kpi-expense', title: 'Total Expenses', titleBn: 'মোট পরিচালিত ব্যয়', widgetType: 'kpi_card', isVisible: true, order: 3, width: 'quarter' },
      { id: 'w-kpi-net-profit', title: 'Net Farm Profit', titleBn: 'খামারের নিট মুনাফা', widgetType: 'kpi_card', isVisible: true, order: 4, width: 'quarter' },
      { id: 'w-chart-sector-pnl', title: 'Sector Financial Performance', titleBn: 'সেক্টরভিত্তিক আর্থিক কর্মক্ষমতা', widgetType: 'bar_chart', isVisible: true, order: 5, width: 'half' },
      { id: 'w-table-pending-approvals', title: 'Pending Vouchers Queue', titleBn: 'অপেক্ষমাণ ব্যয়ের ভাউচার', widgetType: 'table', isVisible: true, order: 6, width: 'half' },
      { id: 'w-alerts-stock', title: 'Low Stock Inventory Alerts', titleBn: 'মজুদ সতর্কতা নোটিশ', widgetType: 'alerts', isVisible: true, order: 7, width: 'half' },
      { id: 'w-table-recent-ops', title: 'Recent Field Operations', titleBn: 'সাম্প্রতিক খামার পরিচালনা', widgetType: 'table', isVisible: true, order: 8, width: 'half' },
    ];

    updateDb((prev) => ({
      ...prev,
      dashboardWidgets: defaults,
    }));

    showToast('Dashboard widgets reset to standard default arrangement.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.dashboardBuilder}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'ড্যাশবোর্ডের উইজেট প্রদর্শন, বিন্যাস ও অবস্থান পরিবর্তন করুন' 
              : 'Customize KPIs, chart placements, widget widths & order on the administrative command center'}
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Layout</span>
        </button>
      </div>

      {/* Guide Banner */}
      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900">
          <p className="font-bold">Live Drag & Click Dashboard Orchestration</p>
          <p className="text-emerald-800 mt-0.5">
            Changes made here directly reflect on the Admin Dashboard instantly. You can toggle visibility, shift widget hierarchy, and toggle 50% vs 100% grid spans.
          </p>
        </div>
      </div>

      {/* Widget List */}
      <div className="space-y-3">
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              widget.isVisible
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'bn' ? widget.titleBn : widget.title}
                  </h3>
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {String(widget.widgetType || 'widget').replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Span: <strong className="text-slate-700 uppercase">{widget.width}</strong> · Status: {widget.isVisible ? 'Visible' : 'Hidden'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleToggleWidth(widget.id)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                title="Toggle Grid Width"
              >
                Width: {widget.width}
              </button>

              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={index === widgets.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleToggleWidget(widget.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                  widget.isVisible
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {widget.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{widget.isVisible ? 'Active' : 'Hidden'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
