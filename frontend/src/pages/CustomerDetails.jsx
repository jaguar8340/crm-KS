import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2, Send } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CustomerDetails({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [correspondenceDialogOpen, setCorrespondenceDialogOpen] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [vehicleFormData, setVehicleFormData] = useState({
    marke: "",
    modell: "",
    chassis_nr: "",
    stamm_nr: "",
    typenschein_nr: "",
    farbe: "",
    inverkehrsetzung: "",
    km_stand: "",
    vista_nr: "",
    verkaeufer: "",
    kundenberater: "",
  });
  const [editFormData, setEditFormData] = useState(null);
  const [correspondenceFormData, setCorrespondenceFormData] = useState({
    bemerkung: "",
    datum: "",
    zeit: "",
    textfeld: "",
    upload1: "",
    upload2: "",
    upload3: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    upload1: null,
    upload2: null,
    upload3: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCustomer();
    fetchVehicles();
    fetchTasks();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  const fetchCustomer = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomer(response.data);
      setEditFormData(response.data);
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Fehler beim Laden des Kunden");
    }
  };

  const fetchVehicles = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/vehicles?customer_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter tasks for this customer
      const customerTasks = response.data.filter(task => task.customer_id === id);
      setTasks(customerTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${API}/vehicles`,
        { ...vehicleFormData, customer_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Fahrzeug erfolgreich hinzugefügt!");
      setVehicleDialogOpen(false);
      setVehicleFormData({
        marke: "",
        modell: "",
        chassis_nr: "",
        stamm_nr: "",
        typenschein_nr: "",
        farbe: "",
        inverkehrsetzung: "",
        km_stand: "",
        vista_nr: "",
        verkaeufer: "",
        kundenberater: "",
      });
      fetchVehicles();
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast.error("Fehler beim Hinzufügen des Fahrzeugs");
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.put(`${API}/customers/${id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Kunde erfolgreich aktualisiert!");
      setEditDialogOpen(false);
      fetchCustomer();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Fehler beim Aktualisieren des Kunden");
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${API}/customers/${id}/remarks`, 
        { text: newRemark },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Bemerkung hinzugefügt!");
      setNewRemark("");
      setRemarkDialogOpen(false);
      fetchCustomer();
    } catch (error) {
      console.error("Error adding remark:", error);
      toast.error("Fehler beim Hinzufügen der Bemerkung");
    }
  };

  const handleAddCorrespondence = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/customers/${id}/correspondence`, correspondenceFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Korrespondenz hinzugefügt!");
      setCorrespondenceDialogOpen(false);
      setCorrespondenceFormData({
        bemerkung: "",
        datum: "",
        zeit: "",
        textfeld: "",
        upload1: "",
        upload2: "",
        upload3: "",
      });
      fetchCustomer();
    } catch (error) {
      console.error("Error adding correspondence:", error);
      toast.error("Fehler beim Hinzufügen der Korrespondenz");
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm("Möchten Sie dieses Fahrzeug wirklich löschen?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Fahrzeug gelöscht");
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Fehler beim Löschen des Fahrzeugs");
    }
  };

  if (!customer) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div>Laden...</div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/customers")} data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="customer-details-title">
            {customer.vorname} {customer.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Customer Data */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white flex flex-row justify-between items-center">
              <CardTitle>Kundendaten</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)} data-testid="edit-customer-button">
                <Edit className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div><strong>Kunden-Nr:</strong> {customer.kunden_nr}</div>
                <div><strong>Vorname:</strong> {customer.vorname}</div>
                <div><strong>Name:</strong> {customer.name}</div>
                {customer.firma && <div><strong>Firma:</strong> {customer.firma}</div>}
                {customer.geburtsdatum && <div><strong>Geburtsdatum:</strong> {formatDate(customer.geburtsdatum)}</div>}
                <div className="pt-3 border-t">
                  <strong>Adresse:</strong>
                  <div>{customer.strasse}</div>
                  <div>{customer.plz} {customer.ort}</div>
                </div>
                {customer.telefon_p && <div><strong>Telefon P:</strong> {customer.telefon_p}</div>}
                {customer.telefon_g && <div><strong>Telefon G:</strong> {customer.telefon_g}</div>}
                {customer.natel && <div><strong>Natel:</strong> {customer.natel}</div>}
                {customer.email_p && <div><strong>Email P:</strong> {customer.email_p}</div>}
                {customer.email_g && <div><strong>Email G:</strong> {customer.email_g}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Right: Vehicles */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white flex flex-row justify-between items-center">
              <CardTitle>Fahrzeuge ({vehicles.length})</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setVehicleDialogOpen(true)} data-testid="add-vehicle-button">
                <Plus className="w-4 h-4 mr-1" />
                Hinzufügen
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {vehicles.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine Fahrzeuge vorhanden</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {vehicles.map((vehicle, index) => (
                    <AccordionItem key={vehicle.id} value={`vehicle-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold">
                            {vehicle.marke} {vehicle.modell}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm pt-2">
                          <div><strong>Marke:</strong> {vehicle.marke}</div>
                          <div><strong>Modell:</strong> {vehicle.modell}</div>
                          {vehicle.chassis_nr && <div><strong>Chassis-Nr:</strong> {vehicle.chassis_nr}</div>}
                          {vehicle.stamm_nr && <div><strong>Stamm-Nr:</strong> {vehicle.stamm_nr}</div>}
                          {vehicle.typenschein_nr && <div><strong>Typenschein-Nr:</strong> {vehicle.typenschein_nr}</div>}
                          {vehicle.farbe && <div><strong>Farbe:</strong> {vehicle.farbe}</div>}
                          {vehicle.inverkehrsetzung && <div><strong>Inverkehrsetzung:</strong> {vehicle.inverkehrsetzung}</div>}
                          {vehicle.km_stand && <div><strong>KM-Stand:</strong> {vehicle.km_stand}</div>}
                          {vehicle.vista_nr && <div><strong>Vista-Nr:</strong> {vehicle.vista_nr}</div>}
                          {vehicle.verkaeufer && <div><strong>Verkäufer:</strong> {vehicle.verkaeufer}</div>}
                          {vehicle.kundenberater && <div><strong>Kundenberater:</strong> {vehicle.kundenberater}</div>}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-4"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            data-testid={`delete-vehicle-${vehicle.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Löschen
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full Width Sections Below */}
        <div className="grid grid-cols-1 gap-6">
          {/* Remarks Section */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white flex flex-row justify-between items-center">
              <CardTitle>Bemerkungen ({customer.bemerkungen?.length || 0})</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setRemarkDialogOpen(true)} data-testid="add-remark-button">
                <Plus className="w-4 h-4 mr-1" />
                Hinzufügen
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {!customer.bemerkungen || customer.bemerkungen.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine Bemerkungen vorhanden</p>
              ) : (
                <div className="space-y-4">
                  {customer.bemerkungen.map((remark, index) => (
                    <div key={index} className="border-l-4 border-amber-500 pl-4 py-2 bg-gray-50">
                      <p className="text-sm text-gray-700">{remark.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(remark.timestamp)} - {remark.user}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Section */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
              <CardTitle>Aufgaben ({tasks.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine Aufgaben vorhanden</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {tasks.map((task, index) => (
                    <AccordionItem key={task.id} value={`task-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold">
                            {task.datum_kontakt} - {task.status === "offen" ? "Offen" : "Erledigt"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm pt-2">
                          <div><strong>Datum:</strong> {task.datum_kontakt} um {task.zeitpunkt_kontakt}</div>
                          <div><strong>Telefon:</strong> {task.telefon_nummer}</div>
                          <div><strong>Zugewiesen an:</strong> {task.assigned_to_name}</div>
                          <div><strong>Bemerkungen:</strong> {task.bemerkungen}</div>
                          <div><strong>Status:</strong> {task.status === "offen" ? "Offen" : "Erledigt"}</div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Correspondence Section */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex flex-row justify-between items-center">
              <CardTitle>Korrespondenz ({customer.korrespondenz?.length || 0})</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setCorrespondenceDialogOpen(true)} data-testid="add-correspondence-button">
                <Plus className="w-4 h-4 mr-1" />
                Hinzufügen
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {!customer.korrespondenz || customer.korrespondenz.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine Korrespondenz vorhanden</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {customer.korrespondenz.map((korr, index) => (
                    <AccordionItem key={index} value={`korr-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold">
                            {korr.datum} - {korr.bemerkung}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm pt-2">
                          <div><strong>Datum:</strong> {korr.datum} um {korr.zeit}</div>
                          <div><strong>Bemerkung:</strong> {korr.bemerkung}</div>
                          <div className="pt-2">
                            <strong>Text:</strong>
                            <p className="mt-1 whitespace-pre-wrap">{korr.textfeld}</p>
                          </div>
                          {korr.upload1 && <div><strong>Upload 1:</strong> {korr.upload1}</div>}
                          {korr.upload2 && <div><strong>Upload 2:</strong> {korr.upload2}</div>}
                          {korr.upload3 && <div><strong>Upload 3:</strong> {korr.upload3}</div>}
                          <p className="text-xs text-gray-500 mt-2">
                            Erstellt: {formatDateTime(korr.timestamp)} - {korr.user}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        {/* Add Remark Dialog */}
        <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Bemerkung hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Bemerkung eingeben..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                rows={4}
                data-testid="remark-input"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddRemark} className="flex-1" data-testid="remark-submit-button">
                  <Send className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
                <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>Abbrechen</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Correspondence Dialog */}
        <Dialog open={correspondenceDialogOpen} onOpenChange={setCorrespondenceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Korrespondenz erstellen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCorrespondence} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bemerkung">Bemerkung*</Label>
                  <Input
                    id="bemerkung"
                    value={correspondenceFormData.bemerkung}
                    onChange={(e) => setCorrespondenceFormData({ ...correspondenceFormData, bemerkung: e.target.value })}
                    required
                    data-testid="correspondence-bemerkung-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datum">Datum*</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={correspondenceFormData.datum}
                    onChange={(e) => setCorrespondenceFormData({ ...correspondenceFormData, datum: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zeit">Zeit*</Label>
                  <Input
                    id="zeit"
                    type="time"
                    value={correspondenceFormData.zeit}
                    onChange={(e) => setCorrespondenceFormData({ ...correspondenceFormData, zeit: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textfeld">Textfeld*</Label>
                <Textarea
                  id="textfeld"
                  value={correspondenceFormData.textfeld}
                  onChange={(e) => setCorrespondenceFormData({ ...correspondenceFormData, textfeld: e.target.value })}
                  rows={6}
                  required
                  data-testid="correspondence-textfeld-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload1">Upload 1 (URL)</Label>
                <Input
                  id="upload1"
                  value={correspondenceFormData.upload1}
                  onChange={(e) => setCorrespondenceFormData({ ...correspondenceFormData, upload1: e.target.value })}
                  placeholder="URL zum Upload 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload2">Upload 2 (URL)</Label>
                <Input
                  id="upload2"
                  value={correspondenceFormData.upload2}
                  onChange={(e) => setCorrespondenceFormData({ ...correspondenceFormData, upload2: e.target.value })}
                  placeholder="URL zum Upload 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload3">Upload 3 (URL)</Label>
                <Input
                  id="upload3"
                  value={correspondenceFormData.upload3}
                  onChange={(e) => setCorrespondenceFormData({ ...correspondenceFormData, upload3: e.target.value })}
                  placeholder="URL zum Upload 3"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="correspondence-submit-button">
                Korrespondenz hinzufügen
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Vehicle Dialog - keeping original */}
        <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neues Fahrzeug hinzufügen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marke">Marke*</Label>
                  <Input
                    id="marke"
                    data-testid="vehicle-marke-input"
                    value={vehicleFormData.marke}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, marke: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modell">Modell*</Label>
                  <Input
                    id="modell"
                    data-testid="vehicle-modell-input"
                    value={vehicleFormData.modell}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, modell: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chassis_nr">Chassis-Nr*</Label>
                  <Input
                    id="chassis_nr"
                    data-testid="vehicle-chassis-input"
                    value={vehicleFormData.chassis_nr}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, chassis_nr: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stamm_nr">Stamm-Nr</Label>
                  <Input
                    id="stamm_nr"
                    value={vehicleFormData.stamm_nr}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, stamm_nr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="typenschein_nr">Typenschein-Nr</Label>
                  <Input
                    id="typenschein_nr"
                    value={vehicleFormData.typenschein_nr}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, typenschein_nr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farbe">Farbe</Label>
                  <Input
                    id="farbe"
                    value={vehicleFormData.farbe}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, farbe: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inverkehrsetzung">Inverkehrsetzung</Label>
                  <Input
                    id="inverkehrsetzung"
                    type="date"
                    value={vehicleFormData.inverkehrsetzung}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, inverkehrsetzung: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="km_stand">KM-Stand</Label>
                  <Input
                    id="km_stand"
                    value={vehicleFormData.km_stand}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, km_stand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vista_nr">Vista-Nr</Label>
                  <Input
                    id="vista_nr"
                    value={vehicleFormData.vista_nr}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, vista_nr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verkaeufer">Verkäufer</Label>
                  <Input
                    id="verkaeufer"
                    value={vehicleFormData.verkaeufer}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, verkaeufer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kundenberater">Kundenberater</Label>
                  <Input
                    id="kundenberater"
                    value={vehicleFormData.kundenberater}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, kundenberater: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" data-testid="vehicle-submit-button">
                Fahrzeug hinzufügen
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        {editFormData && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Kunde bearbeiten</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kunden-Nr</Label>
                    <Input
                      value={editFormData.kunden_nr}
                      onChange={(e) => setEditFormData({ ...editFormData, kunden_nr: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vorname</Label>
                    <Input
                      value={editFormData.vorname}
                      onChange={(e) => setEditFormData({ ...editFormData, vorname: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Firma</Label>
                    <Input
                      value={editFormData.firma}
                      onChange={(e) => setEditFormData({ ...editFormData, firma: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Straße</Label>
                    <Input
                      value={editFormData.strasse}
                      onChange={(e) => setEditFormData({ ...editFormData, strasse: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PLZ</Label>
                    <Input
                      value={editFormData.plz}
                      onChange={(e) => setEditFormData({ ...editFormData, plz: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ort</Label>
                    <Input
                      value={editFormData.ort}
                      onChange={(e) => setEditFormData({ ...editFormData, ort: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon P</Label>
                    <Input
                      value={editFormData.telefon_p}
                      onChange={(e) => setEditFormData({ ...editFormData, telefon_p: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon G</Label>
                    <Input
                      value={editFormData.telefon_g}
                      onChange={(e) => setEditFormData({ ...editFormData, telefon_g: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Natel</Label>
                    <Input
                      value={editFormData.natel}
                      onChange={(e) => setEditFormData({ ...editFormData, natel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email P</Label>
                    <Input
                      type="email"
                      value={editFormData.email_p}
                      onChange={(e) => setEditFormData({ ...editFormData, email_p: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email G</Label>
                    <Input
                      type="email"
                      value={editFormData.email_g}
                      onChange={(e) => setEditFormData({ ...editFormData, email_g: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Geburtsdatum</Label>
                    <Input
                      type="date"
                      value={editFormData.geburtsdatum}
                      onChange={(e) => setEditFormData({ ...editFormData, geburtsdatum: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Änderungen speichern
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
