import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, UserCog, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Users({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Fehler beim Laden der Benutzer");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Benutzer erfolgreich erstellt!");
      setDialogOpen(false);
      setFormData({
        username: "",
        name: "",
        password: "",
        role: "user",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Fehler beim Erstellen des Benutzers");
    }
  };

  const handleDelete = async (userId) => {
    if (userId === user.id) {
      toast.error("Sie können sich selbst nicht löschen!");
      return;
    }

    if (!window.confirm("Möchten Sie diesen Benutzer wirklich löschen?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Benutzer gelöscht");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Fehler beim Löschen des Benutzers");
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="users-title">
            Benutzerverwaltung
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="add-user-button">
                <Plus className="w-4 h-4" />
                Benutzer hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername*</Label>
                  <Input
                    id="username"
                    data-testid="user-username-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name*</Label>
                  <Input
                    id="name"
                    data-testid="user-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort*</Label>
                  <Input
                    id="password"
                    type="password"
                    data-testid="user-password-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rolle*</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger data-testid="user-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Benutzer</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" data-testid="user-submit-button">
                  Benutzer erstellen
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <Card key={u.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`user-card-${u.id}`}>
              <CardHeader className={`text-white ${
                u.role === "admin" 
                  ? "bg-gradient-to-r from-red-500 to-pink-600" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-lg">{u.name}</CardTitle>
                      <p className="text-sm opacity-90">@{u.username}</p>
                    </div>
                  </div>
                  {u.id !== user.id && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleDelete(u.id)}
                      data-testid={`delete-user-${u.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div><strong>Rolle:</strong> {u.role === "admin" ? "Administrator" : "Benutzer"}</div>
                  {u.id === user.id && (
                    <div className="mt-2 text-xs text-blue-600 font-semibold">Das sind Sie</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Keine Benutzer gefunden</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
