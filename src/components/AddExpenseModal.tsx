import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMembers, addExpense } from '../services/api';
import type { Member } from '../types';
import { X, Calculator, Settings2 } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SplitMode = 'EQUAL' | 'CUSTOM';

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  
  // Selection state
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [includeAdmin, setIncludeAdmin] = useState(true);
  
  // Split state
  const [splitMode, setSplitMode] = useState<SplitMode>('EQUAL');
  const [customSplits, setCustomSplits] = useState<{ [key: string]: string }>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      getMembers(user.uid).then(setMembers).catch(console.error);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  // Get all currently involved users based on selection
  const getInvolvedUsers = () => {
    const list = [...selectedMemberIds];
    if (includeAdmin) list.unshift(user.uid);
    return list;
  };

  const involvedUsers = getInvolvedUsers();

  const handleCustomSplitChange = (userId: string, val: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return setError('Vui lòng nhập đầy đủ thông tin');
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setError('Số tiền không hợp lệ');
    
    if (involvedUsers.length === 0) {
      return setError('Vui lòng chọn ít nhất 1 người để chia tiền');
    }

    let splits: { userId: string, amount: number }[] = [];

    if (splitMode === 'EQUAL') {
      const splitAmount = parsedAmount / involvedUsers.length;
      splits = involvedUsers.map(uid => ({
        userId: uid,
        amount: splitAmount
      }));
    } else {
      // Validate custom splits
      let totalCustom = 0;
      for (const uid of involvedUsers) {
        const val = parseFloat(customSplits[uid] || '0');
        if (isNaN(val) || val < 0) return setError('Số tiền chia không hợp lệ');
        totalCustom += val;
        splits.push({ userId: uid, amount: val });
      }

      // Check if custom total matches the bill total (allow tiny floating point variance)
      if (Math.abs(totalCustom - parsedAmount) > 0.01) {
        return setError(`Tổng tiền chia (${totalCustom.toLocaleString('vi-VN')}₫) không khớp với hoá đơn (${parsedAmount.toLocaleString('vi-VN')}₫). Bị lệch ${Math.abs(parsedAmount - totalCustom).toLocaleString('vi-VN')}₫`);
      }
    }

    setSubmitting(true);
    setError('');

    try {
      await addExpense({
        description,
        amount: parsedAmount,
        payerId: user.uid,
        splits,
        involvedUsers: Array.from(new Set([...involvedUsers, user.uid])),
        createdBy: user.uid,
        date: Date.now()
      });

      onSuccess();
      onClose();
      // Reset form
      setDescription('');
      setAmount('');
      setSelectedMemberIds([]);
      setIncludeAdmin(true);
      setSplitMode('EQUAL');
      setCustomSplits({});
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thêm chi phí');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Thêm khoản chi mới</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

          <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Ví dụ: Ăn trưa)</label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent focus:bg-white transition-all text-gray-900 font-medium"
                placeholder="Ăn trưa, mua sắm..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số tiền (VNĐ)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₫</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent focus:bg-white transition-all text-xl font-bold text-gray-900"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-900">Ai tham gia vào khoản chi này?</label>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeAdmin(!includeAdmin)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    includeAdmin 
                      ? 'bg-brand text-white shadow-md shadow-brand/20' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {includeAdmin ? '✓ ' : ''}Bạn
                </button>

                {members.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleMemberSelect(f.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedMemberIds.includes(f.id) 
                        ? 'bg-brand text-white shadow-md shadow-brand/20' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedMemberIds.includes(f.id) ? '✓ ' : ''}{f.name}
                  </button>
                ))}
              </div>
            </div>

            {involvedUsers.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-900">Cách chia tiền</label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setSplitMode('EQUAL')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        splitMode === 'EQUAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Calculator size={16} /> Chia đều
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('CUSTOM')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        splitMode === 'CUSTOM' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Settings2 size={16} /> Tuỳ chỉnh
                    </button>
                  </div>
                </div>

                {splitMode === 'EQUAL' ? (
                  <div className="bg-brand/5 border border-brand/10 p-4 rounded-xl flex items-center justify-between">
                     <span className="text-sm text-brand-dark font-medium">Mỗi người</span>
                     <span className="text-sm text-brand font-semibold">={(parseFloat(amount||'0') / involvedUsers.length).toLocaleString('vi-VN')}₫</span>
                  </div>
                ) : (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {involvedUsers.map(uid => {
                      const isMe = uid === user.uid;
                      const memberName = isMe ? 'Bạn' : members.find(m => m.id === uid)?.name || 'Unknown';
                      
                      return (
                        <div key={uid} className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-gray-700">{memberName}</span>
                          <div className="relative w-1/2">
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₫</span>
                            <input
                              type="number"
                              min="0"
                              required
                              value={customSplits[uid] || ''}
                              onChange={(e) => handleCustomSplitChange(uid, e.target.value)}
                              className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-right font-medium text-gray-900"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Hiển thị số dư còn thiếu */}
                    {amount && (
                      <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                        <span className="text-gray-500">Còn lại:</span>
                        <span className={`font-semibold ${
                          (parseFloat(amount) - involvedUsers.reduce((sum, uid) => sum + parseFloat(customSplits[uid] || '0'), 0)) === 0 
                            ? 'text-green-600' 
                            : 'text-red-500'
                        }`}>
                          {(parseFloat(amount) - involvedUsers.reduce((sum, uid) => sum + parseFloat(customSplits[uid] || '0'), 0)).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="expense-form"
            disabled={submitting || involvedUsers.length === 0}
            className="flex-1 px-4 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20 disabled:opacity-70 disabled:shadow-none"
          >
            {submitting ? 'Đang lưu...' : 'Lưu khoản chi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
