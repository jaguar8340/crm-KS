import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CheckCircle, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Tasks({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    datum_kontakt: "",
    zeitpunkt_kontakt: "",
    bemerkungen: "",
    telefon_nummer: "",
    assigned_to: "",
    assigned_to_name: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchCustomers();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Fehler beim Laden der Aufgaben");
    }
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/tasks`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Aufgabe erfolgreich erstellt!");
      setDialogOpen(false);
      setFormData({
        customer_id: "",
        customer_name: "",
        datum_kontakt: "",
        zeitpunkt_kontakt: "",
        bemerkungen: "",
        telefon_nummer: "",
        assigned_to: "",
        assigned_to_name: "",
      });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Fehler beim Erstellen der Aufgabe");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API}/tasks/${taskId}/status?status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Aufgabenstatus aktualisiert!");
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Fehler beim Aktualisieren des Status");
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: `${customer.vorname} ${customer.name}`,
        telefon_nummer: customer.telefon_p || customer.telefon_g || customer.natel || "",
      });
    }
  };

  const handleUserSelect = (userId) => {
    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser) {
      setFormData({
        ...formData,
        assigned_to: userId,
        assigned_to_name: selectedUser.name,
      });
    }
  };

  const myTasks = tasks.filter((task) => task.assigned_to === user.id);
  const allTasks = tasks;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="tasks-title">
            Aufgaben
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="add-task-button">
                <Plus className="w-4 h-4" />
                Aufgabe erstellen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Kunde*</Label>
                  <Select onValueChange={handleCustomerSelect} required>
                    <SelectTrigger data-testid="task-customer-select">
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.vorname} {customer.name} (Nr: {customer.kunden_nr})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="datum_kontakt">Datum Kontakt*</Label>
                    <Input
                      id="datum_kontakt"
                      type="date"
                      data-testid="task-date-input"
                      value={formData.datum_kontakt}
                      onChange={(e) => setFormData({ ...formData, datum_kontakt: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zeitpunkt_kontakt">Zeitpunkt Kontakt*</Label>
                    <Input
                      id="zeitpunkt_kontakt"
                      type="time"
                      data-testid="task-time-input"
                      value={formData.zeitpunkt_kontakt}
                      onChange={(e) => setFormData({ ...formData, zeitpunkt_kontakt: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefon_nummer">Telefon Nummer*</Label>
                  <Input
                    id="telefon_nummer"
                    data-testid="task-phone-input"
                    value={formData.telefon_nummer}
                    onChange={(e) => setFormData({ ...formData, telefon_nummer: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bemerkungen">Bemerkungen*</Label>
                  <Textarea
                    id="bemerkungen"
                    data-testid="task-notes-input"
                    value={formData.bemerkungen}
                    onChange={(e) => setFormData({ ...formData, bemerkungen: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Mitarbeiter zuweisen*</Label>
                  <Select onValueChange={handleUserSelect} required>
                    <SelectTrigger data-testid="task-assignee-select">
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" data-testid="task-submit-button">
                  Aufgabe erstellen
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-8">
          {/* My Tasks Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Meine Aufgaben</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`my-task-card-${task.id}`}>
                  <CardHeader className={`text-white ${
                    task.status === "offen" 
                      ? "bg-gradient-to-r from-orange-500 to-red-600" 
                      : "bg-gradient-to-r from-green-500 to-teal-600"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.status === "offen" ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        <CardTitle className="text-lg">{task.customer_name}</CardTitle>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">
                        {task.status === "offen" ? "Offen" : "Erledigt"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <div><strong>Datum:</strong> {task.datum_kontakt} um {task.zeitpunkt_kontakt}</div>
                      <div><strong>Telefon:</strong> {task.telefon_nummer}</div>
                      <div><strong>Bemerkungen:</strong> {task.bemerkungen}</div>
                    </div>
                    {task.status === "offen" && (
                      <Button
                        onClick={() => handleStatusChange(task.id, "erledigt")}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        data-testid={`complete-task-${task.id}`}
                      >
                        Als erledigt markieren
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {myTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Keine Aufgaben zugewiesen</p>
              </div>
            )}
          </div>

          {/* All Tasks Section (visible to admin or for overview) */}
          {user.role === "admin" && (
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Alle Aufgaben</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`all-task-card-${task.id}`}>
                    <CardHeader className={`text-white ${
                      task.status === "offen" 
                        ? "bg-gradient-to-r from-orange-500 to-red-600" 
                        : "bg-gradient-to-r from-green-500 to-teal-600"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.status === "offen" ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          <CardTitle className="text-lg">{task.customer_name}</CardTitle>
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          {task.status === "offen" ? "Offen" : "Erledigt"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div><strong>Zugewiesen an:</strong> {task.assigned_to_name}</div>
                        <div><strong>Datum:</strong> {task.datum_kontakt} um {task.zeitpunkt_kontakt}</div>
                        <div><strong>Telefon:</strong> {task.telefon_nummer}</div>
                        <div><strong>Bemerkungen:</strong> {task.bemerkungen}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
