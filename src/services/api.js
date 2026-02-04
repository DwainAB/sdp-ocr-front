/**
 * Service API centralisé pour toutes les requêtes HTTP
 */

const API_URL = import.meta.env.VITE_API_URL;

// ============================================
// UTILITAIRES
// ============================================

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const handleBlobResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.blob();
};

// ============================================
// AUTHENTIFICATION & UTILISATEURS
// ============================================

export const authApi = {
  // Récupérer un utilisateur par email (avec son rôle et permissions)
  getUserByEmail: async (email) => {
    const response = await fetch(`${API_URL}/api/v1/users/by-email?email=${email}`);
    return handleResponse(response);
  },

  // Mettre à jour le statut en ligne d'un utilisateur
  updateLoginStatus: async (userId, isOnline) => {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}/login-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_online: isOnline }),
    });
    return handleResponse(response);
  },

  // Enregistrer un événement de connexion/déconnexion
  recordLoginEvent: async (userId, type) => {
    const response = await fetch(`${API_URL}/api/v1/login-history/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, type }),
    });
    return handleResponse(response);
  },

  // Récupérer les informations Google
  getGoogleUserInfo: async (accessToken) => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return handleResponse(response);
  },
};

// ============================================
// GESTION DES UTILISATEURS (ÉQUIPE)
// ============================================

export const usersApi = {
  // Récupérer tous les utilisateurs
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/v1/users`);
    return handleResponse(response);
  },

  // Récupérer les utilisateurs en ligne
  getOnline: async () => {
    const response = await fetch(`${API_URL}/api/v1/users/online`);
    return handleResponse(response);
  },

  // Récupérer les utilisateurs par équipe
  getByTeam: async (team) => {
    const response = await fetch(`${API_URL}/api/v1/users/team/${team}`);
    return handleResponse(response);
  },

  // Récupérer les utilisateurs par rôle
  getByRole: async (role) => {
    const response = await fetch(`${API_URL}/api/v1/users/role/${role}`);
    return handleResponse(response);
  },

  // Créer un nouvel utilisateur
  create: async (userData) => {
    const response = await fetch(`${API_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Mettre à jour un utilisateur
  update: async (userId, userData) => {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Récupérer l'historique de connexion d'un utilisateur
  getLoginHistory: async (userId, page, size = 10, year = null, month = null) => {
    let url = `${API_URL}/api/v1/login-history/user/${userId}?page=${page}&size=${size}`;
    if (year) url += `&year=${year}`;
    if (month) url += `&month=${month}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Récupérer les périodes disponibles pour l'historique
  getLoginHistoryPeriods: async (userId) => {
    const response = await fetch(`${API_URL}/api/v1/login-history/user/${userId}/periods`);
    return handleResponse(response);
  },
};

// ============================================
// GESTION DES CLIENTS
// ============================================

export const customersApi = {
  // Récupérer tous les clients avec pagination et recherche
  getAll: async (page = 1, pageSize = 10, searchTerm = null) => {
    let url = `${API_URL}/api/v1/customers?page=${page}&size=${pageSize}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Récupérer tous les clients sans pagination
  getAllNoPagination: async () => {
    const response = await fetch(`${API_URL}/api/v1/customers/`);
    return handleResponse(response);
  },

  // Récupérer un client par ID
  getById: async (customerId) => {
    const response = await fetch(`${API_URL}/api/v1/customers/${customerId}`);
    return handleResponse(response);
  },

  // Mettre à jour un client
  update: async (customerId, customerData) => {
    const response = await fetch(`${API_URL}/api/v1/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });
    return handleResponse(response);
  },

  // Rechercher des clients avec paramètres
  search: async (params) => {
    const response = await fetch(`${API_URL}/api/v1/customers?${params}`);
    return handleResponse(response);
  },

  // Mise à jour en masse des clients
  bulkUpdate: async (customers) => {
    const response = await fetch(`${API_URL}/api/v1/customers/bulk`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customers }),
    });
    return handleResponse(response);
  },
};

// ============================================
// GESTION DES GROUPES
// ============================================

export const groupsApi = {
  // Récupérer tous les groupes
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/v1/groups/`);
    return handleResponse(response);
  },

  // Récupérer un groupe par ID
  getById: async (groupId) => {
    const response = await fetch(`${API_URL}/api/v1/groups/${groupId}`);
    return handleResponse(response);
  },

  // Récupérer les groupes d'un client
  getByCustomerId: async (customerId) => {
    const response = await fetch(`${API_URL}/api/v1/groups/customer/${customerId}`);
    return handleResponse(response);
  },

  // Récupérer les clients de plusieurs groupes
  getCustomersByGroupIds: async (groupIds) => {
    const groupIdsParam = groupIds.join(',');
    const response = await fetch(`${API_URL}/api/v1/groups/customers?group_ids=${groupIdsParam}`);
    return handleResponse(response);
  },

  // Créer un nouveau groupe
  create: async (groupData) => {
    const response = await fetch(`${API_URL}/api/v1/groups/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    return handleResponse(response);
  },

  // Supprimer un groupe
  delete: async (groupId) => {
    const response = await fetch(`${API_URL}/api/v1/groups/${groupId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Ajouter des clients à un groupe
  addCustomers: async (groupId, customerIds, addedBy) => {
    const response = await fetch(`${API_URL}/api/v1/groups/${groupId}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_ids: customerIds, added_by: addedBy }),
    });
    return handleResponse(response);
  },

  // Retirer des clients d'un groupe
  removeCustomers: async (groupId, customerIds) => {
    const response = await fetch(`${API_URL}/api/v1/groups/${groupId}/customers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_ids: customerIds }),
    });
    return handleResponse(response);
  },
};

// ============================================
// GESTION DES REVUES CLIENTS
// ============================================

export const customerReviewsApi = {
  // Récupérer les revues avec pagination
  getAll: async (page = 1, pageSize = 10, reviewType = null) => {
    let url = `${API_URL}/api/v1/customer-reviews/?page=${page}&size=${pageSize}`;
    if (reviewType) url += `&review_type=${reviewType}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Récupérer une revue par ID
  getById: async (reviewId) => {
    const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}`);
    return handleResponse(response);
  },

  // Mettre à jour une revue
  update: async (reviewId, reviewData) => {
    const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  },

  // Supprimer une revue
  delete: async (reviewId) => {
    const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Valider/transférer une revue
  transfer: async (reviewId) => {
    const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}/transfer`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Récupérer les fichiers d'une revue
  getFiles: async (reviewId) => {
    const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}/files`);
    return handleResponse(response);
  },

  // Compter les revues en attente
  getPendingCount: async () => {
    const response = await fetch(`${API_URL}/api/v1/customer-reviews/?page=1&size=1`);
    return handleResponse(response);
  },
};

// ============================================
// GESTION DES FORMULES
// ============================================

export const formulasApi = {
  // Récupérer une formule par ID
  getById: async (formulaId) => {
    const response = await fetch(`${API_URL}/api/v1/formulas/${formulaId}`);
    return handleResponse(response);
  },

  // Mettre à jour les notes d'une formule
  updateNotes: async (formulaId, notesData) => {
    const response = await fetch(`${API_URL}/api/v1/formulas/${formulaId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notesData),
    });
    return handleResponse(response);
  },

  // Obtenir l'URL de la miniature d'une formule
  getThumbnailUrl: (formulaId) => {
    return `${API_URL}/api/v1/formulas/${formulaId}/file/thumbnail`;
  },
};

// ============================================
// GESTION DES FICHIERS
// ============================================

export const filesApi = {
  // Obtenir l'URL du contenu d'un fichier
  getContentUrl: (fileId) => {
    return `${API_URL}/api/v1/files/${fileId}/content`;
  },

  // Obtenir l'URL de téléchargement d'un fichier
  getDownloadUrl: (fileId) => {
    return `${API_URL}/api/v1/files/${fileId}/download`;
  },
};

// ============================================
// OCR / EXTRACTION
// ============================================

export const ocrApi = {
  // Uploader un PDF pour extraction OCR
  uploadPdf: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/api/v1/ocr/upload-pdf-csv`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },
};

// ============================================
// EXPORT
// ============================================

export const exportApi = {
  // Générer un fichier CSV
  generateCsv: async (headers, data) => {
    const response = await fetch(`${API_URL}/api/v1/export/generate-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, data }),
    });
    return handleBlobResponse(response);
  },
};

// ============================================
// GESTION DES COMMANDES
// ============================================

export const ordersApi = {
  // Récupérer toutes les commandes avec pagination et filtres combinables
  getAll: async (page = 1, pageSize = 20, { status, customerName, dateFrom, dateTo, orderType, search } = {}) => {
    let url = `${API_URL}/api/v1/orders/?page=${page}&size=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (customerName) url += `&customer_name=${encodeURIComponent(customerName)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    if (orderType) url += `&order_type=${encodeURIComponent(orderType)}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Récupérer les commandes par formula_id
  getByFormulaId: async (formulaId) => {
    const response = await fetch(`${API_URL}/api/v1/orders?formula_id=${formulaId}`);
    return handleResponse(response);
  },

  // Récupérer une commande par ID
  getById: async (orderId) => {
    const response = await fetch(`${API_URL}/api/v1/orders/${orderId}`);
    return handleResponse(response);
  },

  // Mettre à jour le statut d'une commande
  updateStatus: async (orderId, status) => {
    const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Mettre à jour une commande (PUT)
  update: async (orderId, orderData) => {
    const response = await fetch(`${API_URL}/api/v1/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },

  // Ajouter un article à une commande
  addItem: async (orderId, itemData) => {
    const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    return handleResponse(response);
  },

  // Mettre à jour un article d'une commande
  updateItem: async (orderId, itemId, itemData) => {
    const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    return handleResponse(response);
  },

  // Supprimer un article d'une commande
  deleteItem: async (orderId, itemId) => {
    const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// ============================================
// GESTION DES QUOTAS
// ============================================

export const quotasApi = {
  // Récupérer les quotas d'un utilisateur
  getUserQuotas: async (userId) => {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}/quotas`);
    return handleResponse(response);
  },

  // Consommer un quota CSV
  consumeCsvQuota: async (userId) => {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}/quotas/csv/consume`, {
      method: 'POST',
    });
    // Gérer spécifiquement l'erreur 429
    if (response.status === 429) {
      const error = await response.json();
      const quotaError = new Error(error.detail?.message || 'Quota CSV dépassé');
      quotaError.status = 429;
      quotaError.detail = error.detail;
      throw quotaError;
    }
    return handleResponse(response);
  },

  // Consommer un quota PDF
  consumePdfQuota: async (userId) => {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}/quotas/pdf/consume`, {
      method: 'POST',
    });
    // Gérer spécifiquement l'erreur 429
    if (response.status === 429) {
      const error = await response.json();
      const quotaError = new Error(error.detail?.message || 'Quota PDF dépassé');
      quotaError.status = 429;
      quotaError.detail = error.detail;
      throw quotaError;
    }
    return handleResponse(response);
  },
};

// ============================================
// GESTION DES RÔLES
// ============================================

export const rolesApi = {
  // Récupérer tous les rôles avec pagination
  getAll: async (page = 1, size = 50, search = null, includeDeleted = false) => {
    let url = `${API_URL}/api/v1/roles/?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (includeDeleted) url += `&include_deleted=true`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Récupérer un rôle par ID
  getById: async (roleId) => {
    const response = await fetch(`${API_URL}/api/v1/roles/${roleId}`);
    return handleResponse(response);
  },

  // Créer un nouveau rôle
  create: async (roleData) => {
    const response = await fetch(`${API_URL}/api/v1/roles/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    return handleResponse(response);
  },

  // Mettre à jour un rôle
  update: async (roleId, roleData) => {
    const response = await fetch(`${API_URL}/api/v1/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    return handleResponse(response);
  },

  // Supprimer un rôle (soft delete)
  delete: async (roleId) => {
    const response = await fetch(`${API_URL}/api/v1/roles/${roleId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Restaurer un rôle supprimé
  restore: async (roleId) => {
    const response = await fetch(`${API_URL}/api/v1/roles/${roleId}/restore`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Récupérer les utilisateurs d'un rôle
  getUsersByRole: async (roleId) => {
    const response = await fetch(`${API_URL}/api/v1/users/role/${roleId}`);
    return handleResponse(response);
  },
};

// Export par défaut de toutes les APIs
export default {
  auth: authApi,
  users: usersApi,
  customers: customersApi,
  groups: groupsApi,
  customerReviews: customerReviewsApi,
  formulas: formulasApi,
  files: filesApi,
  ocr: ocrApi,
  export: exportApi,
  roles: rolesApi,
  orders: ordersApi,
  quotas: quotasApi,
};
