import type {
  OfflineProjectTemplate,
  OfflineWebsiteTemplate,
  OfflineNoteTemplate,
  OfflineBlogTemplate
} from './offlineTemplates';

export interface CustomCategoryItem {
  id: string;
  label: string;
}

// ── PROJECT TEMPLATES STORAGE ──
export const getCustomProjectTemplates = (): OfflineProjectTemplate[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_project_templates');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get custom project templates', e);
    return [];
  }
};

export const saveCustomProjectTemplate = (template: OfflineProjectTemplate): OfflineProjectTemplate[] => {
  try {
    const list = getCustomProjectTemplates();
    const existingIdx = list.findIndex(t => t.id === template.id);
    let updated: OfflineProjectTemplate[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = template;
    } else {
      updated = [template, ...list];
    }
    localStorage.setItem('agenze_custom_project_templates', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save custom project template', e);
    return [];
  }
};

export const deleteCustomProjectTemplate = (templateId: string): OfflineProjectTemplate[] => {
  try {
    const list = getCustomProjectTemplates().filter(t => t.id !== templateId);
    localStorage.setItem('agenze_custom_project_templates', JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Failed to delete custom project template', e);
    return [];
  }
};

export const getCustomProjectCategories = (): CustomCategoryItem[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_project_categories');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addCustomProjectCategory = (label: string): CustomCategoryItem[] => {
  try {
    const list = getCustomProjectCategories();
    const id = label.trim().toLowerCase().replace(/\s+/g, '_');
    if (!id || list.some(c => c.id === id)) return list;
    const updated = [...list, { id, label: label.trim() }];
    localStorage.setItem('agenze_custom_project_categories', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

// ── WEBSITE TEMPLATES STORAGE ──
export const getCustomWebsiteTemplates = (): OfflineWebsiteTemplate[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_website_templates');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomWebsiteTemplate = (template: OfflineWebsiteTemplate): OfflineWebsiteTemplate[] => {
  try {
    const list = getCustomWebsiteTemplates();
    const existingIdx = list.findIndex(t => t.id === template.id);
    let updated: OfflineWebsiteTemplate[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = template;
    } else {
      updated = [template, ...list];
    }
    localStorage.setItem('agenze_custom_website_templates', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const deleteCustomWebsiteTemplate = (templateId: string): OfflineWebsiteTemplate[] => {
  try {
    const list = getCustomWebsiteTemplates().filter(t => t.id !== templateId);
    localStorage.setItem('agenze_custom_website_templates', JSON.stringify(list));
    return list;
  } catch (e) {
    return [];
  }
};

export const getCustomWebsiteCategories = (): CustomCategoryItem[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_website_categories');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addCustomWebsiteCategory = (label: string): CustomCategoryItem[] => {
  try {
    const list = getCustomWebsiteCategories();
    const id = label.trim().toLowerCase().replace(/\s+/g, '_');
    if (!id || list.some(c => c.id === id)) return list;
    const updated = [...list, { id, label: label.trim() }];
    localStorage.setItem('agenze_custom_website_categories', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

// ── NOTE / MEMO TEMPLATES STORAGE ──
export const getCustomNoteTemplates = (): OfflineNoteTemplate[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_note_templates');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomNoteTemplate = (template: OfflineNoteTemplate): OfflineNoteTemplate[] => {
  try {
    const list = getCustomNoteTemplates();
    const existingIdx = list.findIndex(t => t.id === template.id);
    let updated: OfflineNoteTemplate[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = template;
    } else {
      updated = [template, ...list];
    }
    localStorage.setItem('agenze_custom_note_templates', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const deleteCustomNoteTemplate = (templateId: string): OfflineNoteTemplate[] => {
  try {
    const list = getCustomNoteTemplates().filter(t => t.id !== templateId);
    localStorage.setItem('agenze_custom_note_templates', JSON.stringify(list));
    return list;
  } catch (e) {
    return [];
  }
};

export const getCustomNoteCategories = (): CustomCategoryItem[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_note_categories');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addCustomNoteCategory = (label: string): CustomCategoryItem[] => {
  try {
    const list = getCustomNoteCategories();
    const id = label.trim().toLowerCase().replace(/\s+/g, '_');
    if (!id || list.some(c => c.id === id)) return list;
    const updated = [...list, { id, label: label.trim() }];
    localStorage.setItem('agenze_custom_note_categories', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

// ── BLOG TEMPLATES STORAGE ──
export const getCustomBlogTemplates = (): OfflineBlogTemplate[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_blog_templates');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomBlogTemplate = (template: OfflineBlogTemplate): OfflineBlogTemplate[] => {
  try {
    const list = getCustomBlogTemplates();
    const existingIdx = list.findIndex(t => t.id === template.id);
    let updated: OfflineBlogTemplate[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = template;
    } else {
      updated = [template, ...list];
    }
    localStorage.setItem('agenze_custom_blog_templates', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const deleteCustomBlogTemplate = (templateId: string): OfflineBlogTemplate[] => {
  try {
    const list = getCustomBlogTemplates().filter(t => t.id !== templateId);
    localStorage.setItem('agenze_custom_blog_templates', JSON.stringify(list));
    return list;
  } catch (e) {
    return [];
  }
};

export const getCustomBlogCategories = (): CustomCategoryItem[] => {
  try {
    const raw = localStorage.getItem('agenze_custom_blog_categories');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addCustomBlogCategory = (label: string): CustomCategoryItem[] => {
  try {
    const list = getCustomBlogCategories();
    const id = label.trim();
    if (!id || list.some(c => c.id.toLowerCase() === id.toLowerCase())) return list;
    const updated = [...list, { id, label: id }];
    localStorage.setItem('agenze_custom_blog_categories', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};
