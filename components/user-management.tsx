"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MoreHorizontal } from "lucide-react"

// Mock user data - replace with real data when database is connected
const users = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    country: "Nigeria",
    balance: 45.75,
    machines: 3,
    status: "active",
    joinDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    country: "Kenya",
    balance: 128.5,
    machines: 5,
    status: "active",
    joinDate: "2024-01-14",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    country: "Ghana",
    balance: 0.0,
    machines: 0,
    status: "inactive",
    joinDate: "2024-01-13",
  },
]

export function UserManagement() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "inactive":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "suspended":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-purple-400" />
          <span>User Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex-1">
                <div className="font-medium text-white">{user.name}</div>
                <div className="text-sm text-slate-400">{user.email}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {user.country} • Joined {user.joinDate}
                </div>
              </div>

              <div className="text-right mr-4">
                <div className="text-sm font-medium text-green-400">${user.balance.toFixed(2)}</div>
                <div className="text-xs text-slate-400">{user.machines} machines</div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className={getStatusColor(user.status)}>
                  {user.status}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
