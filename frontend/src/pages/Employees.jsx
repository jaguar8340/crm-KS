import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Briefcase, Trash2, Edit } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Employees({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    vorname: "",
    name: "",
    strasse: "",
    plz: "",
    ort: "",
    email: "",
    telefon: "",
    eintritt_firma: "",
    geburtstag: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Fehler beim Laden der Mitarbeiter");
    }
  };

  const calculateAge = (birthday) => {
    if (!birthday) return "-";
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateYearsOfService = (startDate) => {
    if (!startDate) return "-";
    const start = new Date(startDate);
    const today = new Date();
    let years = today.getFullYear() - start.getFullYear();
    const monthDiff = today.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
      years--;
    }
    return years;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/employees`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Mitarbeiter erfolgreich hinzugefügt!");
      setDialogOpen(false);
      setFormData({
        vorname: "",
        name: "",
        strasse: "",
        plz: "",
        ort: "",
        email: "",
        telefon: "",
        eintritt_firma: "",
        geburtstag: "",
      });
      fetchEmployees();
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error("Fehler beim Hinzufügen des Mitarbeiters");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.put(`${API}/employees/${selectedEmployee.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Mitarbeiter erfolgreich aktualisiert!");
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Fehler beim Aktualisieren des Mitarbeiters");
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Möchten Sie diesen Mitarbeiter wirklich löschen?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Mitarbeiter gelöscht");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Fehler beim Löschen des Mitarbeiters");
    }
  };

  const openEditDialog = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      vorname: employee.vorname,
      name: employee.name,
      strasse: employee.strasse,
      plz: employee.plz,
      ort: employee.ort,
      email: employee.email,
      telefon: employee.telefon,
      eintritt_firma: employee.eintritt_firma,
      geburtstag: employee.geburtstag,
    });
    setEditDialogOpen(true);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="employees-title">
            Mitarbeiter
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="add-employee-button">
                <Plus className="w-4 h-4" />
                Mitarbeiter hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Mitarbeiter hinzufügen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vorname">Vorname*</Label>
                    <Input
                      id="vorname"
                      data-testid="employee-firstname-input"
                      value={formData.vorname}
                      onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name*</Label>
                    <Input
                      id="name"
                      data-testid="employee-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="strasse">Straße*</Label>
                    <Input
                      id="strasse"
                      value={formData.strasse}
                      onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plz">PLZ*</Label>
                    <Input
                      id="plz"
                      value={formData.plz}
                      onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ort">Ort*</Label>
                    <Input
                      id="ort"
                      value={formData.ort}
                      onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email*</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefon">Telefon*</Label>
                    <Input
                      id="telefon"
                      value={formData.telefon}
                      onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eintritt_firma">Eintritt in Firma*</Label>
                    <Input
                      id="eintritt_firma"
                      type="date"
                      value={formData.eintritt_firma}
                      onChange={(e) => setFormData({ ...formData, eintritt_firma: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="geburtstag">Geburtstag*</Label>
                    <Input
                      id="geburtstag"
                      type="date"
                      value={formData.geburtstag}
                      onChange={(e) => setFormData({ ...formData, geburtstag: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" data-testid="employee-submit-button">
                  Mitarbeiter hinzufügen
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {employees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`employee-card-${employee.id}`}>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-lg">
                        {employee.vorname} {employee.name}
                      </CardTitle>
                      <p className="text-sm opacity-90">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEditDialog(employee)} data-testid={`edit-employee-${employee.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(employee.id)} data-testid={`delete-employee-${employee.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Adresse:</strong>
                    <p>{employee.strasse}</p>
                    <p>{employee.plz} {employee.ort}</p>
                  </div>
                  <div>
                    <strong>Kontakt:</strong>
                    <p>Tel: {employee.telefon}</p>
                    <p>Email: {employee.email}</p>
                  </div>
                  <div>
                    <strong>Informationen:</strong>
                    <p>Alter: {calculateAge(employee.geburtstag)} Jahre</p>
                    <p>Dienstjahre: {calculateYearsOfService(employee.eintritt_firma)} Jahre</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Keine Mitarbeiter gefunden</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vorname">Vorname*</Label>
                <Input
                  id="edit-vorname"
                  value={formData.vorname}
                  onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name*</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-strasse">Straße*</Label>
                <Input
                  id="edit-strasse"
                  value={formData.strasse}
                  onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-plz">PLZ*</Label>
                <Input
                  id="edit-plz"
                  value={formData.plz}
                  onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ort">Ort*</Label>
                <Input
                  id="edit-ort"
                  value={formData.ort}
                  onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email*</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefon">Telefon*</Label>
                <Input
                  id="edit-telefon"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-eintritt_firma">Eintritt in Firma*</Label>
                <Input
                  id="edit-eintritt_firma"
                  type="date"
                  value={formData.eintritt_firma}
                  onChange={(e) => setFormData({ ...formData, eintritt_firma: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-geburtstag">Geburtstag*</Label>
                <Input
                  id="edit-geburtstag"
                  type="date"
                  value={formData.geburtstag}
                  onChange={(e) => setFormData({ ...formData, geburtstag: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Änderungen speichern
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
