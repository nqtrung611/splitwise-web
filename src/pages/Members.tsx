import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMembers, createMember } from '../services/api';
import type { Member } from '../types';
import { UserPlus, User } from 'lucide-react';

const Members = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMembers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMembers(user.uid);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [user]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return setError('Vui lòng nhập tên thành viên');
    
    setError('');
    setSuccess('');
    setAdding(true);

    try {
      await createMember(user.uid, name.trim());
      setSuccess('Đã thêm thành viên thành công!');
      setName('');
      fetchMembers(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Thành viên</h1>
      </div>

      {/* Add Member Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-brand" />
          Thêm thành viên
        </h2>
        
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-3">{success}</p>}

        <form onSubmit={handleAddMember} className="flex gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên thành viên (Vd: Nam, Lan...)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-brand text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-dark transition-colors disabled:opacity-70"
          >
            {adding ? 'Đang thêm...' : 'Thêm'}
          </button>
        </form>
      </div>

      {/* Members List */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Danh sách thành viên</h2>
        {loading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : members.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
             <User size={48} className="mx-auto text-gray-300 mb-3" />
             <p className="text-gray-500">Bạn chưa thêm thành viên nào.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => (
              <li key={member.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg uppercase">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{member.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Members;
