import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { User, UserRole } from '../../types';
import { toast } from 'sonner';

const DIVISION_ABBREVIATION_MAP: Record<string, string> = {
  'Office of the Regional Executive Director': 'ORED',
  'Office of the Assistant Regional Director - Management Services': 'ARD-MS',
  'Office of the Assistant Regional Director - Technical Services': 'ARD-TS',
  'Administrative Division': 'AD',
  'Conservation and Development Division': 'CDD',
  'Enforcement Division': 'ED',
  'Finance Division': 'FD',
  'Legal Division': 'LD',
  'Licenses, Patents, and Deeds Division': 'LPDD',
  'Marcos Highway Watershed Forest Reserve': 'MHWFR',
  'Planning and Management Division': 'PMD',
  'Regional GAD Focal Point System': 'RGFPS',
  'Regional Strategic Communication and Initiatives Group': 'RSCIG',
  'Surveys and Mapping Division': 'SMD',
};

const getDivisionFromUsername = (username: string): string => {
  return DIVISION_ABBREVIATION_MAP[username.trim()] || '';
};

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // fullName removed from state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'end-user' as UserRole,
    division: '',
  });

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        fullName: formData.username, // Map username to fullName for backend compatibility
        division: formData.role === 'end-user' ? getDivisionFromUsername(formData.username) : '',
      };

      if (editingUser) {
        await updateUser(editingUser.id, payload);
        toast.success('User updated successfully');
      } else {
        await addUser(payload);
        toast.success('User created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save user.');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      division: getDivisionFromUsername(user.username),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
      toast.success('User deleted successfully');
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'end-user',
      division: '',
    });
  };

  const getRoleBadge = (role: UserRole) => {
    const colors = {
      level1: 'bg-red-100 text-red-700',
      level2a: 'bg-blue-100 text-blue-700',
      level2b: 'bg-purple-100 text-purple-700',
      'end-user': 'bg-gray-100 text-gray-700',
    };
    const labels = {
      level1: 'System Admin',
      level2a: 'Office Supplies',
      level2b: 'Equipment',
      'end-user': 'End User',
    };
    return <Badge className={colors[role]}>{labels[role]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 bg-white border-b py-3">
        <div className="flex justify-between items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">User Account Management</h2>
          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by username..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                        division: prev.role === 'end-user' ? getDivisionFromUsername(e.target.value) : prev.division,
                      }))}
                      required
                    />
                  </div>

                  {/* Full Name Input removed from form */}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password {editingUser && <span className="ml-2 text-xs font-normal text-gray-500">(Leave blank to keep unchanged)</span>}
                    </Label>
                    <Input
                      id="password"
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      required={!editingUser}
                      placeholder={editingUser ? 'Leave blank' : 'Enter password'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Access Level</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData((prev) => ({
                        ...prev,
                        role: value as UserRole,
                        division: value === 'end-user' ? getDivisionFromUsername(prev.username) : '',
                      }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="level1">System Admin</SelectItem>
                        <SelectItem value="level2a">Office Supplies</SelectItem>
                        <SelectItem value="level2b">Equipment</SelectItem>
                        <SelectItem value="end-user">End User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === 'end-user' && (
                    <div className="space-y-2">
                      <Label htmlFor="division">Division</Label>
                      <Input id="division" value={formData.division} readOnly placeholder="Auto-derived" />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                      {editingUser ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>All Users ({filteredUsers.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Division</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-6 text-center text-gray-500">No users found.</TableCell></TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getDivisionFromUsername(user.username) || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(user.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}