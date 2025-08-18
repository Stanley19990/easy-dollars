"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

// Mock earnings data - replace with real data when database is connected
const earningsData = [
  { day: "Day 1", earnings: 0.5 },
  { day: "Day 2", earnings: 1.25 },
  { day: "Day 3", earnings: 2.1 },
  { day: "Day 4", earnings: 3.75 },
  { day: "Day 5", earnings: 5.2 },
  { day: "Day 6", earnings: 7.8 },
  { day: "Day 7", earnings: 10.5 },
]

export function EarningsChart() {
  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <span>Earnings Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
                formatter={(value) => [`$${value}`, "Earnings"]}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#06b6d4", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
