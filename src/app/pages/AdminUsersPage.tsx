import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { showAppToast } from '../components/AppToast';

type UserRow = {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  can_comment: number;
  created_at?: string;
  last_ip?: string;
  last_ip_masked?: string;
  last_ip_location?: string;
};

type ActivityRow = {
  id: number;
  post_title: string;
  content: string;
  status: string;
  ip_address?: string;
  ip_address_masked?: string;
  ip_location?: string;
  created_at?: string;
};

const roleLabels: Record<string, string> = {
  owner: '站长',
  admin: '管理员',
  editor: '编辑',
  teacher: '老师',
  user: '普通用户',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = () => {
    api('/admin/users')
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setUsers(list);
        if (selected) {
          setSelected(list.find((item: UserRow) => item.id === selected.id) || null);
        }
      })
      .catch((err) => showAppToast(err.message || '用户加载失败，请确认当前账号是管理员', 'error'));
  };

  const selectUser = (user: UserRow) => {
    setSelected(user);
    setUsername(user.username || '');
    api(`/admin/users/${user.id}/activity`)
      .then((rows) => setActivity(Array.isArray(rows) ? rows : []))
      .catch((err) => showAppToast(err.message || '用户记录加载失败', 'error'));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (user: UserRow, patch: Partial<UserRow>) => {
    setLoading(true);
    try {
      await api(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: patch.username ?? user.username,
          role: patch.role ?? user.role,
          status: patch.status ?? user.status,
          can_comment: patch.can_comment ?? user.can_comment,
        }),
      });

      showAppToast('用户信息已更新');
      loadUsers();
    } catch (err: any) {
      showAppToast(err.message || '更新失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendResetLink = async (user: UserRow) => {
    setLoading(true);
    try {
      await api(`/admin/users/${user.id}/reset-password`, { method: 'POST' });
      showAppToast('密码重置链接已发送');
    } catch (err: any) {
      showAppToast(err.message || '发送失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const banIp = async (ip?: string) => {
    const target = String(ip || '').trim();
    if (!target) {
      showAppToast('这个用户还没有可屏蔽的 IP', 'error');
      return;
    }

    if (!window.confirm(`确定屏蔽 IP：${target} 吗？`)) return;

    setLoading(true);
    try {
      await api('/admin/banned-ips', {
        method: 'POST',
        body: JSON.stringify({ ip_address: target, reason: `用户管理屏蔽：${selected?.username || ''}` }),
      });
      showAppToast('IP 已屏蔽');
    } catch (err: any) {
      showAppToast(err.message || '屏蔽 IP 失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 px-6 py-16">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur">
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">返回后台</Link>
          <h1 className="mt-2 text-3xl font-black text-gray-900">用户管理</h1>
          <p className="mt-2 text-sm text-gray-500">点击用户后，在右侧修改用户名、发送密码重置链接、禁用账号或屏蔽最近评论 IP。</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="rounded-3xl border border-white/40 bg-white/85 p-6 shadow-xl shadow-black/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3 pr-4">用户</th>
                    <th className="py-3 pr-4">邮箱</th>
                    <th className="py-3 pr-4">角色</th>
                    <th className="py-3 pr-4">状态</th>
                    <th className="py-3 pr-4">评论</th>
                    <th className="py-3 pr-4">最近来源</th>
                    <th className="py-3 pr-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className={`border-b border-gray-100 ${selected?.id === user.id ? 'bg-blue-50/70' : ''}`}>
                      <td className="py-3 pr-4">
                        <button type="button" onClick={() => selectUser(user)} className="font-bold text-gray-900 hover:text-blue-700">
                          {user.username}
                        </button>
                        <div className="text-xs text-gray-400">ID {user.id}</div>
                      </td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4">{roleLabels[user.role] || user.role}</td>
                      <td className="py-3 pr-4">{user.status === 'active' ? '正常' : '已禁用'}</td>
                      <td className="py-3 pr-4">{Number(user.can_comment) === 1 ? '允许' : '禁止'}</td>
                      <td className="py-3 pr-4">
                        <div>{user.last_ip_location || '-'}</div>
                        <div className="text-xs text-gray-400">{user.last_ip_masked || ''}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <button type="button" onClick={() => selectUser(user)} className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200">
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="mt-4 text-gray-500">暂无用户。</p>}
            </div>
          </section>

          <aside className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-xl shadow-black/5">
            {!selected ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">请选择一个用户。</div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400">当前用户</div>
                  <div className="mt-1 text-2xl font-black text-gray-900">{selected.username}</div>
                  <div className="text-sm text-gray-500">{selected.email}</div>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-gray-700">用户名</span>
                  <input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                </label>
                <button type="button" disabled={loading} onClick={() => updateUser(selected, { username })} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                  保存用户名并邮件通知
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <select value={selected.role} onChange={(event) => updateUser(selected, { role: event.target.value })} className="rounded-2xl border border-gray-200 px-3 py-2 text-sm">
                    <option value="owner">站长</option>
                    <option value="admin">管理员</option>
                    <option value="editor">编辑</option>
                    <option value="teacher">老师</option>
                    <option value="user">普通用户</option>
                  </select>
                  <select value={selected.status} onChange={(event) => updateUser(selected, { status: event.target.value })} className="rounded-2xl border border-gray-200 px-3 py-2 text-sm">
                    <option value="active">正常</option>
                    <option value="disabled">禁用</option>
                  </select>
                  <button type="button" disabled={loading} onClick={() => updateUser(selected, { can_comment: Number(selected.can_comment) === 1 ? 0 : 1 })} className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    {Number(selected.can_comment) === 1 ? '禁止评论' : '允许评论'}
                  </button>
                  <button type="button" disabled={loading} onClick={() => sendResetLink(selected)} className="rounded-2xl border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50">
                    发重置链接
                  </button>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-sm font-bold text-gray-900">最近来源</div>
                  <div className="mt-2 text-sm text-gray-600">{selected.last_ip_location || '暂无'}</div>
                  <div className="mt-1 text-xs text-gray-400">{selected.last_ip_masked || ''}</div>
                  <button type="button" disabled={loading || !selected.last_ip} onClick={() => banIp(selected.last_ip)} className="mt-3 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                    屏蔽这个 IP
                  </button>
                </div>

                <div>
                  <div className="text-sm font-bold text-gray-900">最近评论记录</div>
                  <div className="mt-3 space-y-3">
                    {activity.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-gray-100 p-3 text-xs text-gray-500">
                        <div className="font-bold text-gray-800">{item.post_title}</div>
                        <div className="mt-1 line-clamp-2">{item.content}</div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          <span>{item.ip_location || '-'}</span>
                          <span>{item.ip_address_masked || '-'}</span>
                          <button type="button" onClick={() => banIp(item.ip_address)} className="font-bold text-red-600">屏蔽 IP</button>
                        </div>
                      </div>
                    ))}
                    {activity.length === 0 && <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">暂无评论记录。</div>}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
