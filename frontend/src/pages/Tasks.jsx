import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  // Sort tasks by date, newest first
  const sortTasksByDate = (taskList) => {
    return [...taskList].sort((a, b) => {
      const dateA = new Date(`${a.datum_kontakt}T${a.zeitpunkt_kontakt}`);
      const dateB = new Date(`${b.datum_kontakt}T${b.zeitpunkt_kontakt}`);
      return dateB - dateA;
    });
  };

  const myOpenTasks = sortTasksByDate(tasks.filter((task) => task.assigned_to === user.id && task.status === "offen"));
  const myClosedTasks = sortTasksByDate(tasks.filter((task) => task.assigned_to === user.id && task.status === "erledigt"));
  const allOpenTasks = sortTasksByDate(tasks.filter((task) => task.status === "offen"));
  const allClosedTasks = sortTasksByDate(tasks.filter((task) => task.status === "erledigt"));

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

        {/* Meine Aufgaben */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <CardTitle>Meine Aufgaben</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="offen" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="offen">Offene Aufgaben ({myOpenTasks.length})</TabsTrigger>
                <TabsTrigger value="erledigt">Erledigte Aufgaben ({myClosedTasks.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="offen">
                {myOpenTasks.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Keine offenen Aufgaben</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Zeit</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Bemerkungen</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myOpenTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.datum_kontakt}</TableCell>
                          <TableCell>{task.zeitpunkt_kontakt}</TableCell>
                          <TableCell>{task.customer_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{task.bemerkungen}</TableCell>
                          <TableCell>{task.telefon_nummer}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(task.id, "erledigt")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Erledigt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="erledigt">
                {myClosedTasks.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Keine erledigten Aufgaben</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Zeit</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Bemerkungen</TableHead>
                        <TableHead>Telefon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myClosedTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.datum_kontakt}</TableCell>
                          <TableCell>{task.zeitpunkt_kontakt}</TableCell>
                          <TableCell>{task.customer_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{task.bemerkungen}</TableCell>
                          <TableCell>{task.telefon_nummer}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Alle Aufgaben (nur für Admins oder zur Übersicht) */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardTitle>Alle Aufgaben</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="offen" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="offen">Offene Aufgaben ({allOpenTasks.length})</TabsTrigger>
                <TabsTrigger value="erledigt">Erledigte Aufgaben ({allClosedTasks.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="offen">
                {allOpenTasks.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Keine offenen Aufgaben</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Zeit</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Erstellt durch</TableHead>
                        <TableHead>Zugewiesen an</TableHead>
                        <TableHead>Bemerkungen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOpenTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.datum_kontakt}</TableCell>
                          <TableCell>{task.zeitpunkt_kontakt}</TableCell>
                          <TableCell>{task.customer_name}</TableCell>
                          <TableCell>{task.created_by || "-"}</TableCell>
                          <TableCell>{task.assigned_to_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{task.bemerkungen}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="erledigt">
                {allClosedTasks.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Keine erledigten Aufgaben</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Zeit</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Erstellt durch</TableHead>
                        <TableHead>Zugewiesen an</TableHead>
                        <TableHead>Bemerkungen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allClosedTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.datum_kontakt}</TableCell>
                          <TableCell>{task.zeitpunkt_kontakt}</TableCell>
                          <TableCell>{task.customer_name}</TableCell>
                          <TableCell>{task.created_by || "-"}</TableCell>
                          <TableCell>{task.assigned_to_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{task.bemerkungen}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
