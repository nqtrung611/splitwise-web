import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getExpenses, getMembers } from '../services/api';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import { UserCircle2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleData, setSettleData] = useState<{ memberId: string, amount: number, direction: 'MEMBER_TO_ADMIN' | 'ADMIN_TO_MEMBER' } | null>(null);
  const [members, setMembers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Balances
  const [balances, setBalances] = useState<Record<string, number>>({});

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, membersData] = await Promise.all([
        getExpenses(user.uid),
        getMembers(user.uid)
      ]);
      
      const memberMap: Record<string, string> = {};
      membersData.forEach(m => {
        memberMap[m.id] = m.name;
      });
      setMembers(memberMap);
      
      const newBalances: Record<string, number> = {};

      data.forEach(expense => {
        if (expense.payerId === user.uid) {
          // You paid, others owe you
          expense.splits.forEach(s => {
            if (s.userId !== user.uid) {
              newBalances[s.userId] = (newBalances[s.userId] || 0) + s.amount;
            }
          });
        } else {
          // Someone else paid, you owe them
          const mySplit = expense.splits.find(s => s.userId === user.uid)?.amount || 0;
          if (mySplit > 0) {
            newBalances[expense.payerId] = (newBalances[expense.payerId] || 0) - mySplit;
          }
        }
      });

      // Round out tiny floating point differences
      Object.keys(newBalances).forEach(key => {
        if (Math.abs(newBalances[key]) < 0.01) {
          newBalances[key] = 0;
        }
      });
      setMembers(memberMap);
      setBalances(newBalances);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const activeBalances = Object.entries(balances).filter(([id, amount]) => Math.abs(amount) > 0 && members[id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
      </div>



      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex-1 bg-brand text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-brand/30 hover:bg-brand-dark transition-colors active:scale-95 duration-200"
        >
          Thêm chi phí
        </button>
        <button 
          onClick={() => setIsSettleModalOpen(true)}
          className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-xl font-semibold shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors active:scale-95 duration-200"
        >
          Giao dịch
        </button>
      </div>

      {/* Balances Detail */}
      <div className="pt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Chi tiết dư nợ</h2>
        {loading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : activeBalances.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-500">Bạn không có khoản nợ nào cần thanh toán.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeBalances.map(([userId, amount]) => {
              const memberName = members[userId] || 'Thành viên';
              const theyOweYou = amount > 0;
              return (
                <div key={userId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                       <UserCircle2 size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{memberName}</p>
                      {theyOweYou ? (
                        <p className="text-sm font-semibold text-brand">Nợ bạn ₫{Math.abs(amount).toLocaleString('vi-VN')}</p>
                      ) : (
                        <p className="text-sm font-semibold text-red-600">Bạn nợ ₫{Math.abs(amount).toLocaleString('vi-VN')}</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSettleData({
                        memberId: userId,
                        amount: Math.abs(amount),
                        direction: theyOweYou ? 'MEMBER_TO_ADMIN' : 'ADMIN_TO_MEMBER'
                      });
                      setIsSettleModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Thanh toán
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />
      <SettleUpModal 
        isOpen={isSettleModalOpen} 
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettleData(null);
        }} 
        onSuccess={fetchDashboardData} 
        defaultSelectedMemberId={settleData?.memberId}
        defaultAmount={settleData?.amount}
        defaultDirection={settleData?.direction}
      />
    </div>
  );
};

export default Dashboard;
