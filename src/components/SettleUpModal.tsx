import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMembers, addExpense } from '../services/api';
import type { Member } from '../types';
import { X, ArrowRightLeft } from 'lucide-react';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultSelectedMemberId?: string;
  defaultAmount?: number;
  defaultDirection?: 'MEMBER_TO_ADMIN' | 'ADMIN_TO_MEMBER';
}

type Direction = 'MEMBER_TO_ADMIN' | 'ADMIN_TO_MEMBER';

const SettleUpModal: React.FC<SettleUpModalProps> = ({ isOpen, onClose, onSuccess, defaultSelectedMemberId, defaultAmount, defaultDirection }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [direction, setDirection] = useState<Direction>('MEMBER_TO_ADMIN');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      getMembers(user.uid).then(setMembers).catch(console.error);
      if (defaultSelectedMemberId) setSelectedMemberId(defaultSelectedMemberId);
      if (defaultAmount) setAmount(defaultAmount.toString());
      if (defaultDirection) setDirection(defaultDirection);
    }
  }, [isOpen, user, defaultSelectedMemberId, defaultAmount, defaultDirection]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return setError('Vui lòng chọn thành viên');
    if (!amount) return setError('Vui lòng nhập số tiền');
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setError('Số tiền không hợp lệ');

    setSubmitting(true);
    setError('');

    try {
      const payerId = direction === 'MEMBER_TO_ADMIN' ? selectedMemberId : user.uid;
      const receiverId = direction === 'MEMBER_TO_ADMIN' ? user.uid : selectedMemberId;

      const splits = [{
        userId: receiverId,
        amount: parsedAmount
      }];

      await addExpense({
        description: 'Thanh toán nợ',
        amount: parsedAmount,
        payerId: payerId,
        splits,
        involvedUsers: [user.uid, selectedMemberId],
        createdBy: user.uid,
        date: Date.now(),
        isSettleUp: true
      });

      onSuccess();
      onClose();
      // Reset form
      setAmount('');
      setSelectedMemberId('');
      setDirection('MEMBER_TO_ADMIN');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thanh toán nợ');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMemberName = members.find(m => m.id === selectedMemberId)?.name || 'Thành viên';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Giao dịch</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

          <form id="settle-up-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Hướng thanh toán */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-center justify-center w-full gap-4 relative">
                <div className={`flex-1 p-3 rounded-xl border text-center font-semibold transition-all ${direction === 'MEMBER_TO_ADMIN' ? 'bg-white border-brand text-brand shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {selectedMemberName}
                </div>
                
                <button
                  type="button"
                  onClick={() => setDirection(prev => prev === 'MEMBER_TO_ADMIN' ? 'ADMIN_TO_MEMBER' : 'MEMBER_TO_ADMIN')}
                  className="w-10 h-10 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:border-brand hover:text-brand hover:shadow-md transition-all active:scale-95 absolute left-1/2 -translate-x-1/2 z-10"
                >
                  <ArrowRightLeft size={18} className={direction === 'ADMIN_TO_MEMBER' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>

                <div className={`flex-1 p-3 rounded-xl border text-center font-semibold transition-all ${direction === 'ADMIN_TO_MEMBER' ? 'bg-white border-brand text-brand shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  Bạn
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {direction === 'MEMBER_TO_ADMIN' ? `${selectedMemberName} chuyển tiền cho bạn` : `Bạn chuyển tiền cho ${selectedMemberName}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn thành viên</label>
              <select
                required
                value={selectedMemberId}
                onChange={e => setSelectedMemberId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-sm font-medium"
              >
                <option value="">-- Chọn thành viên --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền chuyển (VNĐ)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₫</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent focus:bg-white transition-all text-xl font-bold text-gray-900"
                  placeholder="0"
                />
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="settle-up-form"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20 disabled:opacity-70 disabled:shadow-none"
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettleUpModal;
