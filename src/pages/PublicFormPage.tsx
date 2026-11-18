import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { FormSchema, FormResponse } from '../components/admin/form-maker/formTypes';
import FormPublicView from '../components/admin/form-maker/FormPublicView';
import { autoSaveFormExcelToDrive } from '../utils/formExcelExport';
import { addNotification } from '../utils/notifications';

export const PublicFormPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const forms = await storage.getItem('porto_forms', []);
        let found = Array.isArray(forms) ? forms.find((f: any) => f.id === formId) : null;
        if (!found && formId) {
          const freshForms = await storage.getItem('porto_forms', [], true);
          if (Array.isArray(freshForms)) {
            found = freshForms.find((f: any) => f.id === formId) || null;
          }
        }
        if (found) {
          setForm(found);
        }
      } catch (err) {
        console.error('[PublicFormPage] Failed to load form:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadForm();
  }, [formId]);

  const handleSubmitResponse = async (resp: FormResponse) => {
    try {
      const savedResponses = await storage.getItem('porto_form_responses', {});
      const currentResponses = (savedResponses && savedResponses[resp.formId]) || [];
      const updatedResponses = [resp, ...currentResponses];
      const updatedMap = { ...(savedResponses || {}), [resp.formId]: updatedResponses };
      await storage.setItem('porto_form_responses', updatedMap);

      // Extract respondent lead information from questions & answers
      let respondentName = '';
      let respondentPhone = '';
      let respondentEmail = '';

      if (form && Array.isArray(form.questions)) {
        for (const q of form.questions) {
          const val = resp.answers[q.id];
          if (!val) continue;
          const strVal = String(val).trim();
          const qTitle = (q.title || '').toLowerCase();

          if (q.type === 'phone' || qTitle.includes('wa') || qTitle.includes('telepon') || qTitle.includes('hp') || qTitle.includes('phone')) {
            if (!respondentPhone) respondentPhone = strVal;
          } else if (q.type === 'email' || qTitle.includes('email')) {
            if (!respondentEmail) respondentEmail = strVal;
          } else if ((q.type === 'short_text' && (qTitle.includes('nama') || qTitle.includes('name'))) || (!respondentName && q.type === 'short_text')) {
            if (!respondentName) respondentName = strVal;
          }
        }
      }

      // Sync lead to porto_leads if name, phone, or email is present
      if (respondentName || respondentPhone || respondentEmail) {
        try {
          const existingLeads = await storage.getItem<any[]>('porto_leads', []);
          const safeLeads = Array.isArray(existingLeads) ? existingLeads : [];
          const newLead = {
            id: `lead_form_${Date.now()}`,
            name: respondentName || 'Responden Formulir',
            phone: respondentPhone || '',
            email: respondentEmail || '',
            resourceTitle: `Formulir: ${form?.title || 'Formulir Publik'}`,
            source: 'form-maker',
            downloadedAt: resp.submittedAt || new Date().toISOString(),
            notes: `Tanggapan masuk dari form "${form?.title || ''}"`
          };
          await storage.setItem('porto_leads', [newLead, ...safeLeads], true);
          window.dispatchEvent(new CustomEvent('porto_leads_updated'));
        } catch (eLead) {
          console.warn('[PublicFormPage] Lead sync warning:', eLead);
        }
      }

      // Add Admin Notification
      try {
        await addNotification(
          'lead',
          'Respons Formulir Baru',
          `${respondentName || 'Responden'} baru saja mengisi formulir "${form?.title || 'Formulir'}".`,
          { formId: form?.id, responseId: resp.id }
        );
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('porto_form_responses_updated', { detail: { formId: resp.formId } }));

      // Auto save to Drive if enabled
      if (form && form.autoSaveDrive) {
        autoSaveFormExcelToDrive(form, updatedResponses).then(async (res) => {
          if (res.success && res.url) {
            const forms = await storage.getItem('porto_forms', []);
            if (Array.isArray(forms)) {
              const updatedForms = forms.map((f: any) =>
                f.id === form.id
                  ? { ...f, driveFileUrl: res.url, lastDriveSync: new Date().toISOString() }
                  : f
              );
              await storage.setItem('porto_forms', updatedForms);
            }
          }
        });
      }
    } catch (err) {
      console.error('[PublicFormPage] Error saving response:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: 700
      }}>
        Memuat Formulir...
      </div>
    );
  }

  if (!form) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        padding: 24,
        textAlign: 'center',
        gap: 14
      }}>
        <div style={{ fontSize: 44 }}>📋</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Formulir Tidak Ditemukan</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', maxWidth: 400 }}>
          Tautan formulir ini mungkin sudah tidak aktif atau salah ketik.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            background: 'var(--cms-accent, #6366f1)',
            color: '#ffffff',
            border: 'none',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: 8
          }}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <FormPublicView
      form={form}
      onSubmitResponse={handleSubmitResponse}
      isPreview={false}
      isDarkMode={true}
    />
  );
};

export default PublicFormPage;
