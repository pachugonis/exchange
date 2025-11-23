import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, Trash2, CheckCircle, XCircle, Shield, Mail, Calendar, Eye, Ban } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatters';
import { useTranslation } from '../../hooks/useTranslation';
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
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: number;
  bannedBy?: string;
}

const USERS_STORAGE_KEY = 'mock-users-db';

export const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
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
      toast.error(t('admin.users.messages.loadError'));
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
      toast.error(t('admin.users.messages.saveError'));
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
    toast.success(t('admin.users.messages.updated'));
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
        toast.success(t('admin.users.messages.deleted'));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t('admin.users.messages.deleteError'));
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
    toast.success(`${t('admin.users.messages.emailVerified')} ${!user.emailVerified ? t('admin.users.messages.emailVerified') : t('admin.users.messages.emailUnverified')}`);
  };

  const handleBan = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setShowBanModal(true);
  };

  const confirmBan = () => {
    if (!selectedUser) return;

    if (!banReason.trim()) {
      toast.error(t('admin.users.messages.banReasonRequired'));
      return;
    }

    const updatedUsers = users.map(u =>
      u.id === selectedUser.id
        ? {
            ...u,
            isBanned: true,
            banReason: banReason.trim(),
            bannedAt: Date.now(),
            bannedBy: 'admin',
          }
        : u
    );
    saveUsers(updatedUsers);
    toast.success(`${t('admin.users.messages.userBanned')} ${selectedUser.name} ${t('admin.users.messages.banned')}`);
    setShowBanModal(false);
    setSelectedUser(null);
    setBanReason('');
  };

  const handleUnban = (user: User) => {
    const updatedUsers = users.map(u =>
      u.id === user.id
        ? {
            ...u,
            isBanned: false,
            banReason: undefined,
            bannedAt: undefined,
            bannedBy: undefined,
          }
        : u
    );
    saveUsers(updatedUsers);
    toast.success(`${t('admin.users.messages.userBanned')} ${user.name} ${t('admin.users.messages.unbanned')}`);
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
      case 'verified': return t('admin.users.kycStatuses.verified');
      case 'pending': return t('admin.users.kycStatuses.pending');
      case 'rejected': return t('admin.users.kycStatuses.rejected');
      default: return t('admin.users.kycStatuses.none');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('admin.users.title')}</h1>
          <p className="text-dark-600 dark:text-dark-400">
            {t('admin.users.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">{users.length}</div>
            <div className="text-sm text-dark-500">{t('admin.users.stats.total')}</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {users.filter(u => u.emailVerified).length}
            </div>
            <div className="text-sm text-dark-500">{t('admin.users.stats.emailVerified')}</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {users.filter(u => u.kycStatus === 'verified').length}
            </div>
            <div className="text-sm text-dark-500">{t('admin.users.stats.kycVerified')}</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">
              {users.filter(u => u.twoFactorEnabled).length}
            </div>
            <div className="text-sm text-dark-500">{t('admin.users.stats.twoFaEnabled')}</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">
              {users.filter(u => u.isBanned).length}
            </div>
            <div className="text-sm text-dark-500">{t('admin.users.stats.banned')}</div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder={t('admin.users.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Alert variant="info">
          {searchQuery ? t('admin.users.list.notFound') : t('admin.users.list.noUsers')}
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
                        <span className="text-dark-400">{t('admin.users.list.telegram')}</span>
                        <span>{user.telegram}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <span>{t('admin.users.list.registration')} {formatDate(user.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-dark-400" />
                      <span>{t('admin.users.list.kyc')}</span>
                      <Badge variant={getKycBadgeVariant(user.kycStatus)}>
                        {getKycStatusText(user.kycStatus)}
                      </Badge>
                      {user.kycLevel !== undefined && user.kycLevel > 0 && (
                        <span className="text-xs text-dark-500">({t('admin.users.list.level')} {user.kycLevel})</span>
                      )}
                    </div>
                  </div>

                  {user.twoFactorEnabled && (
                    <div className="mt-2">
                      <Badge variant="info" className="text-xs">
                        🔐 {t('admin.users.list.twoFaEnabled')}
                      </Badge>
                    </div>
                  )}

                  {user.isBanned && (
                    <div className="mt-2">
                      <Badge variant="error" className="text-xs">
                        🚫 {t('admin.users.list.banned')}
                      </Badge>
                      {user.banReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {t('admin.users.list.banReason')} {user.banReason}
                        </p>
                      )}
                      {user.bannedAt && (
                        <p className="text-xs text-dark-500 mt-1">
                          {t('admin.users.list.banDate')} {formatDate(user.bannedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleEmailVerified(user)}
                    className="gap-1"
                    title={user.emailVerified ? t('admin.users.actions.unverifyEmail') : t('admin.users.actions.verifyEmail')}
                  >
                    {user.emailVerified ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>

                  {user.isBanned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnban(user)}
                      className="gap-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      title={t('admin.users.actions.unban')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('admin.users.actions.unban')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBan(user)}
                      className="gap-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      title={t('admin.users.actions.ban')}
                    >
                      <Ban className="w-4 h-4" />
                      {t('admin.users.actions.ban')}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(user)}
                    className="gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('admin.users.actions.edit')}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(user)}
                    className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('admin.users.actions.delete')}
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
        title={t('admin.users.edit.title')}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.users.edit.name')}</label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.users.edit.email')}</label>
              <Input
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                type="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.users.edit.phone')}</label>
              <Input
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.users.edit.telegram')}</label>
              <Input
                value={editForm.telegram || ''}
                onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.users.edit.kycStatus')}</label>
              <select
                value={editForm.kycStatus || 'none'}
                onChange={(e) => setEditForm({ ...editForm, kycStatus: e.target.value as any })}
                className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="none">{t('admin.users.kycStatuses.none')}</option>
                <option value="pending">{t('admin.users.kycStatuses.pending')}</option>
                <option value="verified">{t('admin.users.kycStatuses.verified')}</option>
                <option value="rejected">{t('admin.users.kycStatuses.rejected')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.users.edit.kycLevel')}</label>
              <select
                value={editForm.kycLevel || 0}
                onChange={(e) => setEditForm({ ...editForm, kycLevel: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="0">{t('admin.users.kycLevels.level0')}</option>
                <option value="1">{t('admin.users.kycLevels.level1')}</option>
                <option value="2">{t('admin.users.kycLevels.level2')}</option>
                <option value="3">{t('admin.users.kycLevels.level3')}</option>
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
                {t('admin.users.edit.emailVerified')}
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                {t('admin.users.edit.cancel')}
              </Button>
              <Button onClick={handleSaveEdit}>
                {t('admin.users.edit.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('admin.users.delete.title')}
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-dark-600 dark:text-dark-400">
              {t('admin.users.delete.confirmText')} <strong>{selectedUser.name}</strong> ({selectedUser.email})?
            </p>
            <Alert variant="warning">
              ⚠️ {t('admin.users.delete.warning')}
            </Alert>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                {t('admin.users.delete.cancel')}
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t('admin.users.delete.confirm')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Ban Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        title={t('admin.users.ban.title')}
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-dark-600 dark:text-dark-400">
              {t('admin.users.ban.confirmText')} <strong>{selectedUser.name}</strong> ({selectedUser.email})?
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.users.ban.reason')}
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={t('admin.users.ban.reasonPlaceholder')}
                className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
              />
            </div>

            <Alert variant="warning">
              🚫 {t('admin.users.ban.warning')}
            </Alert>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowBanModal(false)}>
                {t('admin.users.ban.cancel')}
              </Button>
              <Button
                onClick={confirmBan}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {t('admin.users.ban.confirm')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
