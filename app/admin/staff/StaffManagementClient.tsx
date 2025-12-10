'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { UserRole } from '@/utils/auth-types'
import { Plus, Edit, Trash2, UserCheck, UserX, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StaffMember {
  id: string
  full_name: string
  role: UserRole
  pin_code: number | null
  is_active: boolean
  created_at: string
}

interface StaffManagementClientProps {
  initialStaff: StaffMember[]
}

export default function StaffManagementClient({ initialStaff }: StaffManagementClientProps) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(false)

  const filteredStaff = staff.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateStaff = async (formData: FormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/create-staff', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setStaff([result.profile, ...staff])
        setShowCreateModal(false)
      } else {
        alert(result.error || 'Failed to create staff member')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create staff member')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', staffId)

    if (!error) {
      setStaff(staff.map(s => s.id === staffId ? { ...s, is_active: !currentStatus } : s))
    } else {
      alert('Failed to update staff status')
    }
  }

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700',
    cashier: 'bg-blue-100 text-blue-700',
    waiter: 'bg-green-100 text-green-700',
    kitchen: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
        >
          <Plus size={20} />
          Add Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PIN Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{member.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {member.pin_code || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(member.id, member.is_active)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      member.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {member.is_active ? (
                      <>
                        <UserCheck size={14} />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX size={14} />
                        Inactive
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingStaff(member)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingStaff) && (
          <CreateStaffModal
            staff={editingStaff}
            onClose={() => {
              setShowCreateModal(false)
              setEditingStaff(null)
            }}
            onSubmit={handleCreateStaff}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateStaffModal({
  staff,
  onClose,
  onSubmit,
  loading,
}: {
  staff: StaffMember | null
  onClose: () => void
  onSubmit: (formData: FormData) => void
  loading: boolean
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-4">
          {staff ? 'Edit Staff Member' : 'Create Staff Member'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              defaultValue={staff?.full_name || ''}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required={!staff}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              name="role"
              defaultValue={staff?.role || 'waiter'}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="waiter">Waiter</option>
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN Code (Optional)
            </label>
            <input
              type="number"
              name="pin_code"
              defaultValue={staff?.pin_code || ''}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="4-6 digits"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : staff ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
