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
import { Plus, FileText, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Kaufvertraege({ user, onLogout }) {
  const [vertraege, setVertraege] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    kunde_name: "",
    kunde_vorname: "",
    kunde_plz: "",
    kunde_ort: "",
    kunde_telefon: "",
    kunde_email: "",
    fahrzeug_marke: "",
    fahrzeug_modell: "",
    fahrzeug_chassis_nr: "",
    fahrzeug_stamm_nr: "",
    fahrzeug_farbe: "",
    fahrzeug_inverkehrsetzung: "",
    fahrzeug_typ: "",
    verkaufspreis: "",
    eintausch_marke: "",
    eintausch_modell: "",
    eintausch_chassis_nr: "",
    eintausch_stamm_nr: "",
    eintausch_farbe: "",
    eintausch_inverkehrsetzung: "",
    eintausch_km_stand: "",
    eintausch_preis: "",
    eintausch_bemerkungen: "",
    eintausch_upload_ausweis: "",
    eintausch_upload_aussen: "",
    eintausch_upload_innen: "",
    eintausch_uploads: [],
  });
  const [uploadFiles, setUploadFiles] = useState({
    ausweis: null,
    aussen: null,
    innen: null,
    additional: [],
  });

  useEffect(() => {
    fetchVertraege();
  }, []);

  const fetchVertraege = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/kaufvertraege`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVertraege(response.data);
    } catch (error) {
      console.error("Error fetching kaufvertraege:", error);
      toast.error("Fehler beim Laden der Kaufverträge");
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
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const token = localStorage.getItem("token");

    try {
      const submitData = { ...formData };
      
      // Upload eintausch files
      if (uploadFiles.ausweis) {
        const filename = await handleFileUpload(uploadFiles.ausweis);
        if (filename) submitData.eintausch_upload_ausweis = filename;
      }
      if (uploadFiles.aussen) {
        const filename = await handleFileUpload(uploadFiles.aussen);
        if (filename) submitData.eintausch_upload_aussen = filename;
      }
      if (uploadFiles.innen) {
        const filename = await handleFileUpload(uploadFiles.innen);
        if (filename) submitData.eintausch_upload_innen = filename;
      }
      
      // Upload additional files
      const additionalFilenames = [];
      for (const file of uploadFiles.additional) {
        const filename = await handleFileUpload(file);
        if (filename) additionalFilenames.push(filename);
      }
      submitData.eintausch_uploads = additionalFilenames;

      await axios.post(`${API}/kaufvertraege`, submitData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Kaufvertrag erfolgreich erstellt!");
      setDialogOpen(false);
      resetForm();
      fetchVertraege();
    } catch (error) {
      console.error("Error creating kaufvertrag:", error);
      toast.error("Fehler beim Erstellen des Kaufvertrags");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      kunde_name: "",
      kunde_vorname: "",
      kunde_plz: "",
      kunde_ort: "",
      kunde_telefon: "",
      kunde_email: "",
      fahrzeug_marke: "",
      fahrzeug_modell: "",
      fahrzeug_chassis_nr: "",
      fahrzeug_stamm_nr: "",
      fahrzeug_farbe: "",
      fahrzeug_inverkehrsetzung: "",
      fahrzeug_typ: "",
      verkaufspreis: "",
      eintausch_marke: "",
      eintausch_modell: "",
      eintausch_chassis_nr: "",
      eintausch_stamm_nr: "",
      eintausch_farbe: "",
      eintausch_inverkehrsetzung: "",
      eintausch_km_stand: "",
      eintausch_preis: "",
      eintausch_bemerkungen: "",
      eintausch_upload_ausweis: "",
      eintausch_upload_aussen: "",
      eintausch_upload_innen: "",
      eintausch_uploads: [],
    });
    setUploadFiles({
      ausweis: null,
      aussen: null,
      innen: null,
      additional: [],
    });
  };

  const handleAdditionalFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles({ ...uploadFiles, additional: files });
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

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="kaufvertraege-title">
            Kaufverträge
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="add-kaufvertrag-button">
                <Plus className="w-4 h-4" />
                Vertrag hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Kaufvertrag erstellen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Kundeninfo */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Kundeninformationen</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name*</Label>
                      <Input
                        value={formData.kunde_name}
                        onChange={(e) => setFormData({ ...formData, kunde_name: e.target.value })}
                        required
                        data-testid="kv-kunde-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vorname*</Label>
                      <Input
                        value={formData.kunde_vorname}
                        onChange={(e) => setFormData({ ...formData, kunde_vorname: e.target.value })}
                        required
                        data-testid="kv-kunde-vorname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PLZ</Label>
                      <Input
                        value={formData.kunde_plz}
                        onChange={(e) => setFormData({ ...formData, kunde_plz: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ort</Label>
                      <Input
                        value={formData.kunde_ort}
                        onChange={(e) => setFormData({ ...formData, kunde_ort: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input
                        value={formData.kunde_telefon}
                        onChange={(e) => setFormData({ ...formData, kunde_telefon: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.kunde_email}
                        onChange={(e) => setFormData({ ...formData, kunde_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Fahrzeug */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Fahrzeug</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marke*</Label>
                      <Input
                        value={formData.fahrzeug_marke}
                        onChange={(e) => setFormData({ ...formData, fahrzeug_marke: e.target.value })}
                        required
                        data-testid="kv-fahrzeug-marke"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modell*</Label>
                      <Input
                        value={formData.fahrzeug_modell}
                        onChange={(e) => setFormData({ ...formData, fahrzeug_modell: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chassis-Nr*</Label>
                      <Input
                        value={formData.fahrzeug_chassis_nr}
                        onChange={(e) => setFormData({ ...formData, fahrzeug_chassis_nr: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stamm-Nr</Label>
                      <Input
                        value={formData.fahrzeug_stamm_nr}
                        onChange={(e) => setFormData({ ...formData, fahrzeug_stamm_nr: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Farbe</Label>
                      <Input
                        value={formData.fahrzeug_farbe}
                        onChange={(e) => setFormData({ ...formData, fahrzeug_farbe: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inverkehrsetzung</Label>
                      <Input
                        type="date"
                        value={formData.fahrzeug_inverkehrsetzung}
                        onChange={(e) => setFormData({ ...formData, fahrzeug_inverkehrsetzung: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Typ*</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, fahrzeug_typ: value })} required>
                        <SelectTrigger data-testid="kv-fahrzeug-typ">
                          <SelectValue placeholder="Typ auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Neuwagen">Neuwagen</SelectItem>
                          <SelectItem value="Vorführwagen">Vorführwagen</SelectItem>
                          <SelectItem value="Occasion">Occasion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Verkaufspreis*</Label>
                      <Input
                        value={formData.verkaufspreis}
                        onChange={(e) => setFormData({ ...formData, verkaufspreis: e.target.value })}
                        required
                        placeholder="CHF"
                      />
                    </div>
                  </div>
                </div>

                {/* Eintauschwagen */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Eintauschwagen (optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marke</Label>
                      <Input
                        value={formData.eintausch_marke}
                        onChange={(e) => setFormData({ ...formData, eintausch_marke: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modell</Label>
                      <Input
                        value={formData.eintausch_modell}
                        onChange={(e) => setFormData({ ...formData, eintausch_modell: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chassis-Nr</Label>
                      <Input
                        value={formData.eintausch_chassis_nr}
                        onChange={(e) => setFormData({ ...formData, eintausch_chassis_nr: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stamm-Nr</Label>
                      <Input
                        value={formData.eintausch_stamm_nr}
                        onChange={(e) => setFormData({ ...formData, eintausch_stamm_nr: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Farbe</Label>
                      <Input
                        value={formData.eintausch_farbe}
                        onChange={(e) => setFormData({ ...formData, eintausch_farbe: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inverkehrsetzung</Label>
                      <Input
                        type="date"
                        value={formData.eintausch_inverkehrsetzung}
                        onChange={(e) => setFormData({ ...formData, eintausch_inverkehrsetzung: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>KM-Stand</Label>
                      <Input
                        value={formData.eintausch_km_stand}
                        onChange={(e) => setFormData({ ...formData, eintausch_km_stand: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Eintauschpreis</Label>
                      <Input
                        value={formData.eintausch_preis}
                        onChange={(e) => setFormData({ ...formData, eintausch_preis: e.target.value })}
                        placeholder="CHF"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Bemerkungen</Label>
                      <Textarea
                        value={formData.eintausch_bemerkungen}
                        onChange={(e) => setFormData({ ...formData, eintausch_bemerkungen: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Fahrzeugausweis</Label>
                      <Input
                        type="file"
                        onChange={(e) => setUploadFiles({ ...uploadFiles, ausweis: e.target.files[0] })}
                        data-testid="kv-upload-ausweis"
                      />
                      {uploadFiles.ausweis && <p className="text-xs text-gray-500">{uploadFiles.ausweis.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Fahrzeug Aussen</Label>
                      <Input
                        type="file"
                        onChange={(e) => setUploadFiles({ ...uploadFiles, aussen: e.target.files[0] })}
                        data-testid="kv-upload-aussen"
                      />
                      {uploadFiles.aussen && <p className="text-xs text-gray-500">{uploadFiles.aussen.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Fahrzeug Innen</Label>
                      <Input
                        type="file"
                        onChange={(e) => setUploadFiles({ ...uploadFiles, innen: e.target.files[0] })}
                        data-testid="kv-upload-innen"
                      />
                      {uploadFiles.innen && <p className="text-xs text-gray-500">{uploadFiles.innen.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Weitere Uploads (Mehrfach)</Label>
                      <Input
                        type="file"
                        multiple
                        onChange={handleAdditionalFilesChange}
                        data-testid="kv-upload-multiple"
                      />
                      {uploadFiles.additional.length > 0 && (
                        <p className="text-xs text-gray-500">{uploadFiles.additional.length} Datei(en) ausgewählt</p>
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={uploading} data-testid="kv-submit-button">
                  {uploading ? "Hochladen..." : "Kaufvertrag erstellen"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {vertraege.map((vertrag) => (
            <Card key={vertrag.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`kv-card-${vertrag.id}`}>
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-lg">
                        {vertrag.kunde_vorname} {vertrag.kunde_name}
                      </CardTitle>
                      <p className="text-sm opacity-90">
                        {vertrag.fahrzeug_marke} {vertrag.fahrzeug_modell} ({vertrag.fahrzeug_typ})
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>Details anzeigen</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm uppercase text-gray-600">Kunde</h4>
                          <div><strong>Name:</strong> {vertrag.kunde_vorname} {vertrag.kunde_name}</div>
                          {vertrag.kunde_plz && <div><strong>PLZ/Ort:</strong> {vertrag.kunde_plz} {vertrag.kunde_ort}</div>}
                          {vertrag.kunde_telefon && <div><strong>Telefon:</strong> {vertrag.kunde_telefon}</div>}
                          {vertrag.kunde_email && <div><strong>Email:</strong> {vertrag.kunde_email}</div>}
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm uppercase text-gray-600">Verkaufsfahrzeug</h4>
                          <div><strong>Fahrzeug:</strong> {vertrag.fahrzeug_marke} {vertrag.fahrzeug_modell}</div>
                          <div><strong>Chassis:</strong> {vertrag.fahrzeug_chassis_nr}</div>
                          <div><strong>Typ:</strong> {vertrag.fahrzeug_typ}</div>
                          <div><strong>Verkaufspreis:</strong> CHF {vertrag.verkaufspreis}</div>
                        </div>
                        {vertrag.eintausch_marke && (
                          <div className="space-y-3 col-span-2 border-t pt-4">
                            <h4 className="font-semibold text-sm uppercase text-gray-600">Eintauschwagen</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><strong>Fahrzeug:</strong> {vertrag.eintausch_marke} {vertrag.eintausch_modell}</div>
                              {vertrag.eintausch_chassis_nr && <div><strong>Chassis:</strong> {vertrag.eintausch_chassis_nr}</div>}
                              {vertrag.eintausch_km_stand && <div><strong>KM-Stand:</strong> {vertrag.eintausch_km_stand}</div>}
                              {vertrag.eintausch_preis && <div><strong>Eintauschpreis:</strong> CHF {vertrag.eintausch_preis}</div>}
                              {vertrag.eintausch_bemerkungen && (
                                <div className="col-span-2">
                                  <strong>Bemerkungen:</strong>
                                  <p className="mt-1">{vertrag.eintausch_bemerkungen}</p>
                                </div>
                              )}
                              {vertrag.eintausch_upload_ausweis && (
                                <div>
                                  <strong>Fahrzeugausweis:</strong>{" "}
                                  <a href={`${BACKEND_URL}/uploads/${vertrag.eintausch_upload_ausweis}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                    Anzeigen
                                  </a>
                                </div>
                              )}
                              {vertrag.eintausch_upload_aussen && (
                                <div>
                                  <strong>Foto Aussen:</strong>{" "}
                                  <a href={`${BACKEND_URL}/uploads/${vertrag.eintausch_upload_aussen}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                    Anzeigen
                                  </a>
                                </div>
                              )}
                              {vertrag.eintausch_upload_innen && (
                                <div>
                                  <strong>Foto Innen:</strong>{" "}
                                  <a href={`${BACKEND_URL}/uploads/${vertrag.eintausch_upload_innen}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                    Anzeigen
                                  </a>
                                </div>
                              )}
                              {vertrag.eintausch_uploads && vertrag.eintausch_uploads.length > 0 && (
                                <div className="col-span-2">
                                  <strong>Weitere Uploads:</strong>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {vertrag.eintausch_uploads.map((upload, idx) => (
                                      <a
                                        key={idx}
                                        href={`${BACKEND_URL}/uploads/${upload}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs"
                                      >
                                        Upload {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-4">Erstellt: {formatDateTime(vertrag.created_at)} - {vertrag.created_by}</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {vertraege.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Keine Kaufverträge vorhanden</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
