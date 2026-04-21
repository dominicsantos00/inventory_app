import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Search, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../../types';
import { toast } from 'sonner';

// --- Official Email Mapping ---
const END_USER_DIVISIONS = [
  { name: 'Office of the Regional Executive Director', email: 'car@denr.gov.ph' },
  { name: 'Office of the Assistant Regional Director - Management Services', email: 'oardms.car@denr.gov.ph' },
  { name: 'Office of the Assistant Regional Director - Technical Services', email: 'oardts.car@denr.gov.ph' },
  { name: 'Administrative Division', email: 'admin.car@denr.gov.ph' },
  { name: 'Conservation and Development Division', email: 'cdd.car@denr.gov.ph' },
  { name: 'Enforcement Division', email: 'enforcement.car@denr.gov.ph' },
  { name: 'Finance Division', email: 'finance.car@denr.gov.ph' },
  { name: 'Legal Division', email: 'legal.car@denr.gov.ph' },
  { name: 'Licenses, Patents, and Deeds Division', email: 'lpdd.car@denr.gov.ph' },
  { name: 'Marcos Highway Watershed Forest Reserve', email: 'mhwfr.pamo@denr.gov.ph' },
  { name: 'Planning and Management Division', email: 'pmd.car@denr.gov.ph' },
  { name: 'Regional GAD Focal Point System', email: 'gad.car@denr.gov.ph' },
  { name: 'Regional Strategic Communication and Initiatives Group', email: 'rscig.car@denr.gov.ph' },
  { name: 'Surveys and Mapping Division', email: 'smd.car@denr.gov.ph' },
];

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'end-user' as UserRole,
    division: '',
  });

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.division && user.division.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        // Ensure division is only saved if they are an end-user
        division: formData.role === 'end-user' ? formData.division : '',
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
      toast.error(error.message || 'Failed to save user.');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName || '',
      email: user.email || '',
      password: '', // Kept blank for security; backend handles ignoring it if unchanged
      role: user.role,
      division: user.division || '',
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
    setFormData({ username: '', fullName: '', email: '', password: '', role: 'end-user', division: '' });
  };

  const handleDivisionChange = (selectedDivision: string) => {
    const divisionData = END_USER_DIVISIONS.find(d => d.name === selectedDivision);
    setFormData(prev => ({
      ...prev,
      division: selectedDivision,
      // Auto-fill the official email if a matching division is found
      email: divisionData ? divisionData.email : prev.email
    }));
  };

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<string, string> = {
      level1: 'bg-red-50 text-red-700 border-red-200',
      level2a: 'bg-blue-50 text-blue-700 border-blue-200',
      level2b: 'bg-purple-50 text-purple-700 border-purple-200',
      'end-user': 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const labels: Record<string, string> = {
      level1: 'System Admin',
      level2a: 'Office Supplies',
      level2b: 'Equipment',
      'end-user': 'End User',
    };
    return <Badge variant="outline" className={`font-medium ${styles[role]}`}>{labels[role]}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage system access, roles, and division assignments.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or division..."
              className="pl-9 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md sm:max-w-lg border-slate-200 shadow-lg p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <DialogTitle className="text-xl">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  
                  {/* Account Basics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-slate-700">Username <span className="text-red-500">*</span></Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                        required
                        className="border-slate-200"
                        placeholder="e.g. jdelacruz"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-slate-700">
                        Password {editingUser && <span className="ml-1 text-[10px] font-normal text-slate-400">(Leave blank to keep)</span>}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        required={!editingUser}
                        placeholder={editingUser ? '••••••••' : 'Secure password'}
                        className="border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-slate-700">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      required
                      placeholder="Juan Dela Cruz"
                      className="border-slate-200"
                    />
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="role" className="text-slate-700">Access Level</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData((prev) => ({
                        ...prev,
                        role: value as UserRole,
                        division: value !== 'end-user' ? '' : prev.division,
                      }))}
                    >
                      <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="level1">System Admin</SelectItem>
                        <SelectItem value="level2a">Office Supplies Admin</SelectItem>
                        <SelectItem value="level2b">Equipment Admin</SelectItem>
                        <SelectItem value="end-user">End User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Division Dropdown (Only for End Users) */}
                  {formData.role === 'end-user' && (
                    <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-100 rounded-lg mt-2">
                      <Label htmlFor="division" className="text-slate-700">Division / Office <span className="text-red-500">*</span></Label>
                      <Select value={formData.division} onValueChange={handleDivisionChange}>
                        <SelectTrigger className="border-slate-200 bg-white">
                          <SelectValue placeholder="Select an office to auto-fill email" />
                        </SelectTrigger>
                        <SelectContent>
                          {END_USER_DIVISIONS.map(div => (
                            <SelectItem key={div.name} value={div.name}>{div.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Email Field (Auto-fills if division is selected) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700">Official Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="email@denr.gov.ph"
                      className="border-slate-200"
                    />
                  </div>
                  
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editingUser ? 'Save Changes' : 'Create User'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Table Card */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Details</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Level</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Division / Office</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <UserIcon className="h-8 w-8 text-slate-300 mb-2" />
                      <p>No users found matching your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{user.fullName || user.username}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">@{user.username}</span>
                           <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-slate-700">
                         {user.role === 'end-user' ? (user.division || 'Unassigned') : 'System Wide'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(user)} className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(user.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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