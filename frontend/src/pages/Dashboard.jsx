import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, Briefcase, CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    customers: 0,
    vehicles: 0,
    employees: 0,
    tasks: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const [customersRes, vehiclesRes, employeesRes, tasksRes] = await Promise.all([
        axios.get(`${API}/customers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tasks/my`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setStats({
        customers: customersRes.data.length,
        vehicles: vehiclesRes.data.length,
        employees: employeesRes.data.length,
        tasks: tasksRes.data.filter(t => t.status === "offen").length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statCards = [
    { title: "Kunden", value: stats.customers, icon: Users, color: "from-blue-500 to-blue-600" },
    { title: "Fahrzeuge", value: stats.vehicles, icon: Car, color: "from-green-500 to-green-600" },
    { title: "Mitarbeiter", value: stats.employees, icon: Briefcase, color: "from-purple-500 to-purple-600" },
    { title: "Meine offenen Aufgaben", value: stats.tasks, icon: CheckSquare, color: "from-orange-500 to-orange-600" },
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="dashboard-title">
            Willkommen zurück, {user.name}!
          </h1>
          <p className="text-gray-600 text-lg">Hier ist eine Übersicht über Ihr CRM</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300" data-testid={`stat-card-${index}`}>
              <CardHeader className={`bg-gradient-to-r ${stat.color} text-white pb-4`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{stat.title}</CardTitle>
                  <stat.icon className="w-8 h-8" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
