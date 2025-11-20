import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, Trash2, CheckCircle, XCircle, Shield, Mail, Calendar, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  telegram?: string;
  createdAt: number;
  emailVerified: boolean;
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  kycLevel?: number;
  twoFactorEnabled?: boolean;
}

const USERS_STORAGE_KEY = 'mock-users-db';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  // Load users from localStorage
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const usersList = Object.values(data).map((record: any) => record.user);
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Ошибка загрузки пользователей');
    }
  };

  const saveUsers = (updatedUsers: User[]) => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Update users in the database structure
        updatedUsers.forEach(user => {
          const userRecord = data[user.email];
          if (userRecord) {
            data[user.email] = {
              ...userRecord,
              user: user,
            };
          }
        });
        
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
        setUsers(updatedUsers);
        loadUsers();
      }
    } catch (error) {
      console.error('Error saving users:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      telegram: user.telegram,
      emailVerified: user.emailVerified,
      kycStatus: user.kycStatus,
      kycLevel: user.kycLevel,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map(user =>
      user.id === selectedUser.id
        ? { ...user, ...editForm }
        : user
    );

    saveUsers(updatedUsers);
    toast.success('Пользователь обновлен');
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedUser) return;

    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        delete data[selectedUser.email];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
        
        const updatedUsers = users.filter(u => u.id !== selectedUser.id);
        setUsers(updatedUsers);
        toast.success('Пользователь удален');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Ошибка удаления');
    }

    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const toggleEmailVerified = (user: User) => {
    const updatedUsers = users.map(u =>
      u.id === user.id
        ? { ...u, emailVerified: !u.emailVerified }
        : u
    );
    saveUsers(updatedUsers);
    toast.success(`Email ${!user.emailVerified ? 'подтвержден' : 'отменен'}`);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getKycBadgeVariant = (status?: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getKycStatusText = (status?: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'None';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление пользователями</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Просмотр и редактирование пользователей системы
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">{users.length}</div>
            <div className="text-sm text-dark-500">Всего пользователей</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {users.filter(u => u.emailVerified).length}
            </div>
            <div className="text-sm text-dark-500">Email подтвержден</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {users.filter(u => u.kycStatus === 'verified').length}
            </div>
            <div className="text-sm text-dark-500">KYC верифицировано</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">
              {users.filter(u => u.twoFactorEnabled).length}
            </div>
            <div className="text-sm text-dark-500">2FA включен</div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Поиск по email, имени или ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Alert variant="info">
          {searchQuery ? 'Пользователи не найдены' : 'Пока нет зарегистрированных пользователей'}
        </Alert>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-dark-500">ID: {user.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-dark-400" />
                      <span>{user.email}</span>
                      {user.emailVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>

                    {user.telegram && (
                      <div className="flex items-center gap-2">
                        <span className="text-dark-400">Telegram:</span>
                        <span>{user.telegram}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <span>Регистрация: {formatDate(user.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-dark-400" />
                      <span>KYC:</span>
                      <Badge variant={getKycBadgeVariant(user.kycStatus)}>
                        {getKycStatusText(user.kycStatus)}
                      </Badge>
                      {user.kycLevel !== undefined && user.kycLevel > 0 && (
                        <span className="text-xs text-dark-500">(Level {user.kycLevel})</span>
                      )}
                    </div>
                  </div>

                  {user.twoFactorEnabled && (
                    <div className="mt-2">
                      <Badge variant="info" className="text-xs">
                        🔐 2FA включен
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleEmailVerified(user)}
                    className="gap-1"
                    title={user.emailVerified ? 'Отменить подтверждение email' : 'Подтвердить email'}
                  >
                    {user.emailVerified ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(user)}
                    className="gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Изменить
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(user)}
                    className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Редактировать пользователя"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Имя</label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                type="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Телефон</label>
              <Input
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telegram</label>
              <Input
                value={editForm.telegram || ''}
                onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Статус KYC</label>
              <select
                value={editForm.kycStatus || 'none'}
                onChange={(e) => setEditForm({ ...editForm, kycStatus: e.target.value as any })}
                className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="none">None</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Уровень KYC</label>
              <select
                value={editForm.kycLevel || 0}
                onChange={(e) => setEditForm({ ...editForm, kycLevel: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="0">0 - None</option>
                <option value="1">1 - Basic</option>
                <option value="2">2 - Intermediate</option>
                <option value="3">3 - Full</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emailVerified"
                checked={editForm.emailVerified || false}
                onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
              />
              <label htmlFor="emailVerified" className="text-sm">
                Email подтвержден
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveEdit}>
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Подтвердите удаление"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-dark-600 dark:text-dark-400">
              Вы уверены, что хотите удалить пользователя <strong>{selectedUser.name}</strong> ({selectedUser.email})?
            </p>
            <Alert variant="warning">
              ⚠️ Это действие необратимо. Все данные пользователя будут удалены.
            </Alert>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Отмена
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
