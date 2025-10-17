import { useEffect, useState, useRef } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Eye, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Customers({ user, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    kunden_nr: "",
    vorname: "",
    name: "",
    firma: "",
    strasse: "",
    plz: "",
    ort: "",
    telefon_p: "",
    telefon_g: "",
    natel: "",
    email_p: "",
    email_g: "",
    geburtsdatum: "",
    bemerkungen: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.kunden_nr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.firma && customer.firma.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Fehler beim Laden der Kunden");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/customers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Kunde erfolgreich hinzugefügt!");
      setDialogOpen(false);
      setFormData({
        kunden_nr: "",
        vorname: "",
        name: "",
        firma: "",
        strasse: "",
        plz: "",
        ort: "",
        telefon_p: "",
        telefon_g: "",
        natel: "",
        email_p: "",
        email_g: "",
        geburtsdatum: "",
        bemerkungen: "",
      });
      fetchCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Fehler beim Hinzufügen des Kunden");
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/customers/upload-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn("Import errors:", response.data.errors);
        toast.warning(`${response.data.errors.length} Fehler beim Import. Siehe Konsole für Details.`);
      }
      setUploadDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Fehler beim Hochladen der CSV-Datei");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadCSVTemplate = () => {
    const headers = "kunden_nr,vorname,name,firma,strasse,plz,ort,telefon_p,telefon_g,natel,email_p,email_g,geburtsdatum,bemerkungen\n";
    const example = "K001,Max,Mustermann,Musterfirma GmbH,Musterstraße 1,8000,Zürich,+41 44 123 45 67,+41 44 987 65 43,+41 79 123 45 67,max@example.com,max.work@example.com,1980-05-15,Wichtiger Kunde\n";
    const blob = new Blob([headers + example], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kunden_vorlage.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="customers-title">
            Kundenverwaltung
          </h1>
          <div className="flex gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2" data-testid="upload-csv-button">
                  <Upload className="w-4 h-4" />
                  CSV Hochladen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Kunden CSV hochladen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Laden Sie eine CSV-Datei mit Kundendaten hoch. Die CSV muss folgende Spalten enthalten:
                    kunden_nr, vorname, name, firma, strasse, plz, ort, telefon_p, telefon_g, natel, email_p, email_g, geburtsdatum, bemerkungen
                  </p>
                  <Button
                    variant="outline"
                    onClick={downloadCSVTemplate}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Vorlage herunterladen
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    disabled={uploading}
                    data-testid="csv-file-input"
                  />
                  {uploading && <p className="text-sm text-gray-600">Hochladen...</p>}
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="add-customer-button">
                  <Plus className="w-4 h-4" />
                  Kunde hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Neuen Kunden hinzufügen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kunden_nr">Kunden-Nr.*</Label>
                      <Input
                        id="kunden_nr"
                        data-testid="customer-number-input"
                        value={formData.kunden_nr}
                        onChange={(e) => setFormData({ ...formData, kunden_nr: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vorname">Vorname*</Label>
                      <Input
                        id="vorname"
                        data-testid="customer-firstname-input"
                        value={formData.vorname}
                        onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name*</Label>
                      <Input
                        id="name"
                        data-testid="customer-name-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firma">Firma</Label>
                      <Input
                        id="firma"
                        value={formData.firma}
                        onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
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
                      <Label htmlFor="telefon_p">Telefon P</Label>
                      <Input
                        id="telefon_p"
                        value={formData.telefon_p}
                        onChange={(e) => setFormData({ ...formData, telefon_p: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefon_g">Telefon G</Label>
                      <Input
                        id="telefon_g"
                        value={formData.telefon_g}
                        onChange={(e) => setFormData({ ...formData, telefon_g: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="natel">Natel</Label>
                      <Input
                        id="natel"
                        value={formData.natel}
                        onChange={(e) => setFormData({ ...formData, natel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_p">Email P</Label>
                      <Input
                        id="email_p"
                        type="email"
                        value={formData.email_p}
                        onChange={(e) => setFormData({ ...formData, email_p: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_g">Email G</Label>
                      <Input
                        id="email_g"
                        type="email"
                        value={formData.email_g}
                        onChange={(e) => setFormData({ ...formData, email_g: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                      <Input
                        id="geburtsdatum"
                        type="date"
                        value={formData.geburtsdatum}
                        onChange={(e) => setFormData({ ...formData, geburtsdatum: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" data-testid="customer-submit-button">
                    Kunde hinzufügen
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Suche nach Name, Vorname, Kundennummer oder Firma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
            data-testid="customer-search-input"
          />
        </div>

        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle>Kundenliste ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunden-Nr</TableHead>
                    <TableHead>Vorname</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Ort</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                      <TableCell className="font-medium">{customer.kunden_nr}</TableCell>
                      <TableCell>{customer.vorname}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.firma || "-"}</TableCell>
                      <TableCell>{customer.ort}</TableCell>
                      <TableCell>{customer.telefon_p || customer.telefon_g || customer.natel || "-"}</TableCell>
                      <TableCell>{customer.email_p || customer.email_g || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          data-testid={`view-customer-${customer.id}`}
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Keine Kunden gefunden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
