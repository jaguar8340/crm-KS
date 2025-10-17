import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Send, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClientExperience({ user, onLogout }) {
  const [cases, setCases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [solutionDialogOpen, setSolutionDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newSolution, setNewSolution] = useState("");
  const [manualCustomer, setManualCustomer] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    marke: "",
    modell: "",
    datum: "",
    zeit: "",
    kundenreklamation: "",
    datei_upload: "",
  });

  useEffect(() => {
    fetchCases();
    fetchCustomers();
  }, []);

  const fetchCases = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/client-experience`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCases(response.data);
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast.error("Fehler beim Laden der Fälle");
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

  const handleFileUpload = async (file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.filename;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Fehler beim Hochladen der Datei");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const token = localStorage.getItem("token");

    try {
      const submitData = { ...formData };
      
      // Upload file if exists
      if (uploadedFile) {
        const filename = await handleFileUpload(uploadedFile);
        if (filename) {
          submitData.datei_upload = filename;
        }
      }

      await axios.post(`${API}/client-experience`, submitData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Fall erfolgreich eröffnet!");
      setDialogOpen(false);
      setFormData({
        customer_id: "",
        customer_name: "",
        marke: "",
        modell: "",
        datum: "",
        zeit: "",
        kundenreklamation: "",
        datei_upload: "",
      });
      setUploadedFile(null);
      setManualCustomer(false);
      fetchCases();
    } catch (error) {
      console.error("Error creating case:", error);
      toast.error("Fehler beim Eröffnen des Falls");
    } finally {
      setUploading(false);
    }
  };

  const handleAddSolution = async () => {
    if (!newSolution.trim()) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API}/client-experience/${selectedCase.id}/solution`,
        { text: newSolution },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Lösung hinzugefügt!");
      setNewSolution("");
      setSolutionDialogOpen(false);
      setSelectedCase(null);
      fetchCases();
    } catch (error) {
      console.error("Error adding solution:", error);
      toast.error("Fehler beim Hinzufügen der Lösung");
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: `${customer.vorname} ${customer.name}`,
      });
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Sort cases by date, newest first
  const sortedCases = [...cases].sort((a, b) => {
    const dateA = new Date(`${a.datum}T${a.zeit}`);
    const dateB = new Date(`${b.datum}T${b.zeit}`);
    return dateB - dateA;
  });

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="client-experience-title">
            Client Experience
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="open-case-button">
                <Plus className="w-4 h-4" />
                Fall eröffnen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Fall eröffnen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="manual-customer"
                      checked={manualCustomer}
                      onChange={(e) => setManualCustomer(e.target.checked)}
                    />
                    <Label htmlFor="manual-customer" className="cursor-pointer">
                      Kunde manuell eingeben
                    </Label>
                  </div>
                  
                  {manualCustomer ? (
                    <div>
                      <Label htmlFor="customer_name">Kundenname*</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value, customer_id: "" })}
                        required
                        data-testid="manual-customer-name-input"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="customer">Kunde auswählen*</Label>
                      <Select onValueChange={handleCustomerSelect} required>
                        <SelectTrigger data-testid="ce-customer-select">
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
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marke">Marke*</Label>
                    <Input
                      id="marke"
                      value={formData.marke}
                      onChange={(e) => setFormData({ ...formData, marke: e.target.value })}
                      required
                      data-testid="ce-marke-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modell">Modell*</Label>
                    <Input
                      id="modell"
                      value={formData.modell}
                      onChange={(e) => setFormData({ ...formData, modell: e.target.value })}
                      required
                      data-testid="ce-modell-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="datum">Datum*</Label>
                    <Input
                      id="datum"
                      type="date"
                      value={formData.datum}
                      onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zeit">Zeit*</Label>
                    <Input
                      id="zeit"
                      type="time"
                      value={formData.zeit}
                      onChange={(e) => setFormData({ ...formData, zeit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kundenreklamation">Kundenreklamation*</Label>
                  <Textarea
                    id="kundenreklamation"
                    value={formData.kundenreklamation}
                    onChange={(e) => setFormData({ ...formData, kundenreklamation: e.target.value })}
                    rows={6}
                    required
                    data-testid="ce-complaint-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Datei hochladen</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setUploadedFile(e.target.files[0])}
                    data-testid="ce-file-upload"
                  />
                  {uploadedFile && <p className="text-xs text-gray-500">{uploadedFile.name}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={uploading} data-testid="ce-submit-button">
                  {uploading ? "Hochladen..." : "Fall eröffnen"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {sortedCases.map((ce) => (
            <Card key={ce.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`ce-case-${ce.id}`}>
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-lg">{ce.customer_name}</CardTitle>
                      <p className="text-sm opacity-90">
                        {ce.marke} {ce.modell} - {ce.datum} um {ce.zeit}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <strong className="block mb-2">Kundenreklamation:</strong>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">{ce.kundenreklamation}</p>
                  </div>
                  
                  {ce.datei_upload && (
                    <div>
                      <strong className="block mb-2">Datei:</strong>
                      <a 
                        href={`${BACKEND_URL}/uploads/${ce.datei_upload}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        {ce.datei_upload}
                      </a>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Lösungen ({ce.loesungen?.length || 0})</h3>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCase(ce);
                          setSolutionDialogOpen(true);
                        }}
                        data-testid={`add-solution-${ce.id}`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Lösung hinzufügen
                      </Button>
                    </div>
                    
                    {!ce.loesungen || ce.loesungen.length === 0 ? (
                      <p className="text-gray-500 text-sm">Noch keine Lösungen vorhanden</p>
                    ) : (
                      <div className="space-y-3">
                        {[...ce.loesungen].reverse().map((solution, index) => (
                          <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                            <p className="text-sm text-gray-700">{solution.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(solution.timestamp)} - {solution.user}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    Erstellt von: {ce.created_by}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cases.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Keine Fälle vorhanden</p>
          </div>
        )}
      </div>

      {/* Add Solution Dialog */}
      <Dialog open={solutionDialogOpen} onOpenChange={setSolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lösung hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Lösung eingeben..."
              value={newSolution}
              onChange={(e) => setNewSolution(e.target.value)}
              rows={6}
              data-testid="solution-input"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddSolution} className="flex-1" data-testid="solution-submit-button">
                <Send className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
              <Button variant="outline" onClick={() => {
                setSolutionDialogOpen(false);
                setSelectedCase(null);
                setNewSolution("");
              }}>
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
