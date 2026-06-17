import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getExpenses, getMembers } from '../services/api';
import type { Expense } from '../types';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, UserCircle2, History, BarChart3 } from 'lucide-react';

interface MemberReport {
  id: string;
  name: string;
  totalExpense: number;
  totalTransferredToAdmin: number;
  totalReceivedFromAdmin: number;
  currentDebt: number;
}

const Transactions = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reports, setReports] = useState<MemberReport[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchTransactionsAndReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, membersData] = await Promise.all([
        getExpenses(user.uid),
        getMembers(user.uid)
      ]);
      
      // Sort by date descending
      const sortedData = data.sort((a, b) => b.date - a.date);
      setExpenses(sortedData);

      // Compute Reports & Member Map
      const reportMap: Record<string, MemberReport> = {};
      const map: Record<string, string> = {};
      membersData.forEach(m => {
        map[m.id] = m.name;
        reportMap[m.id] = {
          id: m.id,
          name: m.name,
          totalExpense: 0,
          totalTransferredToAdmin: 0,
          totalReceivedFromAdmin: 0,
          currentDebt: 0
        };
      });
      
      setMembersMap(map);

      data.forEach(expense => {
        if (!expense.isSettleUp) {
          // Normal Expense
          expense.splits.forEach(s => {
            if (s.userId !== user.uid && reportMap[s.userId]) {
              reportMap[s.userId].totalExpense += s.amount;
              reportMap[s.userId].currentDebt += s.amount;
            }
          });
        } else {
          // Settle Up
          if (expense.payerId !== user.uid && reportMap[expense.payerId]) {
            // Member transferred to Admin
            reportMap[expense.payerId].totalTransferredToAdmin += expense.amount;
            reportMap[expense.payerId].currentDebt -= expense.amount;
          } else {
            // Admin transferred to Member
            const receiverId = expense.splits[0]?.userId;
            if (receiverId && receiverId !== user.uid && reportMap[receiverId]) {
              reportMap[receiverId].totalReceivedFromAdmin += expense.amount;
              reportMap[receiverId].currentDebt += expense.amount;
            }
          }
        }
      });

      // Round out floating point errors
      const finalReports = Object.values(reportMap).map(r => ({
        ...r,
        totalExpense: Math.abs(r.totalExpense) < 0.01 ? 0 : r.totalExpense,
        totalTransferredToAdmin: Math.abs(r.totalTransferredToAdmin) < 0.01 ? 0 : r.totalTransferredToAdmin,
        totalReceivedFromAdmin: Math.abs(r.totalReceivedFromAdmin) < 0.01 ? 0 : r.totalReceivedFromAdmin,
        currentDebt: Math.abs(r.currentDebt) < 0.01 ? 0 : r.currentDebt,
      }));

      // Filter out members who have 0 for everything
      const activeReports = finalReports.filter(r => 
        r.totalExpense > 0 || r.totalTransferredToAdmin > 0 || r.totalReceivedFromAdmin > 0 || Math.abs(r.currentDebt) > 0
      );

      setReports(activeReports);

    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsAndReports();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
      </div>

      {/* Reports Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="text-brand" size={24} /> Báo cáo thành viên
        </h2>
        
        {loading ? (
          <p className="text-gray-500">Đang tải báo cáo...</p>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">Chưa có dữ liệu báo cáo nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-400">
                    <UserCircle2 size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{report.name}</h3>
                </div>
                
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Tổng chi phí</p>
                    <p className="font-semibold text-gray-900">₫{report.totalExpense.toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Dư nợ hiện tại</p>
                    {report.currentDebt > 0 ? (
                      <p className="font-bold text-brand">Nợ bạn ₫{Math.abs(report.currentDebt).toLocaleString('vi-VN')}</p>
                    ) : report.currentDebt < 0 ? (
                      <p className="font-bold text-red-600">Bạn nợ ₫{Math.abs(report.currentDebt).toLocaleString('vi-VN')}</p>
                    ) : (
                      <p className="font-bold text-green-600">Đã chốt sổ (0₫)</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider flex items-center gap-1">
                      <ArrowDownRight size={14} className="text-green-500" /> Đã chuyển cho bạn
                    </p>
                    <p className="font-semibold text-green-600">₫{report.totalTransferredToAdmin.toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider flex items-center gap-1">
                      <ArrowUpRight size={14} className="text-red-400" /> Đã nhận từ bạn
                    </p>
                    <p className="font-semibold text-gray-600">₫{report.totalReceivedFromAdmin.toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danh sách giao dịch */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <History className="text-brand" size={24} /> Lịch sử giao dịch chi tiết
        </h2>
        {loading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🌱</span>
            </div>
            <p className="text-gray-600 font-medium text-lg">Chưa có giao dịch nào!</p>
            <p className="text-gray-400 mt-2">Các khoản chi phí sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const iPaid = expense.payerId === user?.uid;
              const mySplit = expense.splits.find(s => s.userId === user?.uid)?.amount || 0;
              
              let displayDescription = expense.description;
              if (expense.isSettleUp) {
                const payerName = expense.payerId === user?.uid ? 'Bạn' : membersMap[expense.payerId] || 'Thành viên';
                const receiverId = expense.splits[0]?.userId;
                const receiverName = receiverId === user?.uid ? 'Bạn' : membersMap[receiverId || ''] || 'Thành viên';
                displayDescription = `${payerName} chuyển tiền cho ${receiverName}`;
              }
              
              return (
                <div key={expense.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iPaid ? 'bg-brand/10 text-brand' : 'bg-red-50 text-red-500'} ${expense.isSettleUp ? 'bg-green-50 text-green-600' : ''}`}>
                      {expense.isSettleUp ? <CheckCircle2 size={24} /> : (iPaid ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{displayDescription}</p>
                      <p className="text-sm text-gray-500 font-medium">{new Date(expense.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {expense.isSettleUp ? (
                      iPaid ? (
                        <>
                          <p className="text-sm text-brand font-semibold mb-0.5">Đã chuyển</p>
                          <p className="font-bold text-gray-900 text-lg">₫{expense.amount.toLocaleString('vi-VN')}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-green-600 font-semibold mb-0.5">Đã chuyển</p>
                          <p className="font-bold text-green-600 text-lg">₫{mySplit.toLocaleString('vi-VN')}</p>
                        </>
                      )
                    ) : (
                      iPaid ? (
                        <>
                          <p className="text-sm text-gray-500 font-medium">Bạn đã trả</p>
                          <p className="font-bold text-gray-900 text-lg">₫{expense.amount.toLocaleString('vi-VN')}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-500 font-medium">Bạn nợ</p>
                          <p className="font-bold text-red-600 text-lg">₫{mySplit.toLocaleString('vi-VN')}</p>
                        </>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
