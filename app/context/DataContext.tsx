import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../lib/apiBase';

export interface Application {
  id: string;
  applicantId: string;
  applicationDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'lottery' | 'placed';
  score: number;
  academicLevel: string;
  yearsOfService: number;
  maritalStatus: string;
  childrenCount?: number;
  jobResponsibility: string;
  isDisabled: boolean;
  applicantName: string;
  cycleId?: string | null;
  cycleTitle?: string | null;
  cycleRoundLabel?: string | null;
  cycleDescription?: string | null;
  cycleHouseDetails?: string | null;
  cycleMonthlyPayment?: number | null;
  cycleApplicationFee?: number | null;
  cycleElectricityService?: string | null;
  cycleWaterService?: string | null;
  cycleHouseType?: string | null;
  cycleHouseNumber?: string | null;
  cycleBedrooms?: number | null;
  cycleBathrooms?: number | null;
  cycleDeadline?: string | null;
  cycleCampusName?: string | null;
  cycleBlockName?: string | null;
  cycleHouseImages?: string[];
}

/** Housing application round / cycle (system_admin launches). */
export interface HousingCycle {
  id: string;
  title?: string | null;
  roundLabel?: string | null;
  description?: string | null;
  houseDetails?: string | null;
  monthlyPayment?: number | null;
  applicationFee?: number | null;
  electricityService?: string | null;
  waterService?: string | null;
  houseType?: string | null;
  campusId?: string | null;
  blockId?: string | null;
  houseNumber?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  deadline?: string | null;
  status: 'open' | 'closed';
  createdAt?: string | null;
  campusName?: string | null;
  blockName?: string | null;
  houseImages?: string[];
}

export interface Campus {
  id: string;
  name: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Block {
  id: string;
  blockName: string;
  totalHouses: number;
  campus: string;
  campusId?: string;
}

export interface House {
  id: string;
  blockId: string;
  houseNumber: string;
  houseType: 'studio' | 'one_bedroom' | 'two_bedroom' | 'three_bedroom';
  status: 'available' | 'occupied' | 'maintenance';
  blockName?: string;
  campusId?: string;
  campusName?: string;
  price?: number;
  monthlyPayment?: number;
  bedrooms?: number;
  bathrooms?: number;
  electricService?: string;
  waterService?: string;
}

export interface Resident {
  id: string;
  applicantId: string;
  houseId: string;
  residentName: string;
  moveInDate: string;
  residenceStatus: 'active' | 'left';
  campusId?: string;
  houseNumber?: string;
  blockName?: string;
}

export interface Payment {
  id: string;
  residentId: string;
  residentName: string;
  amount: number;
  paymentDate: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  month: string;
  campusName?: string;
  payment_type?: string;
  transaction_id?: string;
  screenshot_path?: string;
}

export interface Notification {
  id: string;
  message: string;
  dateSent: string;
  type: 'info' | 'warning' | 'success';
  recipient: 'all' | 'applicants' | 'residents';
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  message: string;
  date: string;
  status: 'pending' | 'resolved';
}

export interface ResidentRequest {
  id: string;
  residentId: string;
  residentName: string;
  requestType: 'maintenance' | 'complaint' | 'inquiry' | 'other' | 'leave_house';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  dateSubmitted: string;
  houseNumber?: string;
  blockName?: string;
}

interface DataContextType {
  applications: Application[];
  housingCycles: HousingCycle[];
  addApplication: (application: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  campuses: Campus[];
  addCampus: (campus: Campus) => void;
  updateCampus: (id: string, updates: Partial<Campus>) => void;
  deleteCampus: (id: string) => void;
  blocks: Block[];
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  houses: House[];
  addHouse: (house: House) => void;
  updateHouse: (id: string, updates: Partial<House>) => void;
  deleteHouse: (id: string) => void;
  residents: Resident[];
  addResident: (resident: Resident) => void;
  updateResident: (id: string, updates: Partial<Resident>) => void;
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  feedback: Feedback[];
  addFeedback: (fb: Feedback) => void;
  updateFeedback: (id: string, updates: Partial<Feedback>) => void;
  residentRequests: ResidentRequest[];
  addResidentRequest: (request: ResidentRequest) => void;
  updateResidentRequest: (id: string, updates: Partial<ResidentRequest>) => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function normalizeHouseType(raw: string | undefined): House['houseType'] {
  const s = (raw ?? 'studio').toLowerCase().replace(/\s+/g, '_');
  if (s.includes('three') || s === 'three_bedroom') return 'three_bedroom';
  if (s.includes('two') || s === 'two_bedroom') return 'two_bedroom';
  if (s.includes('one') || s === 'one_bedroom') return 'one_bedroom';
  if (s.includes('studio')) return 'studio';
  return 'studio';
}

function normalizeRequestStatus(raw: string): ResidentRequest['status'] {
  switch (raw) {
    case 'verified_by_campus_admin':
      return 'in_progress';
    case 'approved':
      return 'resolved';
    case 'pending':
    case 'in_progress':
    case 'resolved':
    case 'rejected':
      return raw;
    default:
      return 'pending';
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [housingCycles, setHousingCycles] = useState<HousingCycle[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [residentRequests, setResidentRequests] = useState<ResidentRequest[]>([]);

  const fetchJson = async <T,>(path: string): Promise<T | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`);
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch (error) {
      console.error(`Failed to load ${path}:`, error);
      return null;
    }
  };

  const refreshData = async () => {
      if (!user) {
        setApplications([]);
        setHousingCycles([]);
        setBlocks([]);
        setHouses([]);
        setResidents([]);
        setPayments([]);
        setNotifications([]);
        setResidentRequests([]);
        return;
      }

      const campusFilter = user?.role === 'campus_admin' && user.campusId ? `?campus_id=${user.campusId}` : '';
      const residentCampusFilter =
        user?.role === 'campus_admin' && user.campusId ? `?campusId=${user.campusId}` : '';
      const applicantFilter = user?.role === 'applicant' ? `?applicantId=${user.id}` : '';
      const paymentFilter = user?.role === 'applicant' ? `?userId=${user.id}` : '';

      const loadCycles = user?.role === 'applicant' || user?.role === 'chms_admin';

      const [
        applicationsResult,
        blocksResult,
        housesResult,
        residentsResult,
        paymentsResult,
        notificationResult,
        requestsResult,
        cyclesResult,
        campusesResult,
      ] = await Promise.all([
        fetchJson<{ records: Application[] }>(`/applications/read.php${applicantFilter}`),
        fetchJson<{ records: Block[] }>(`/blocks/read.php${campusFilter}`),
        fetchJson<{ records: Array<House & { house_type?: House['houseType'] }> }>(
          `/houses/read.php${campusFilter}`
        ),
        fetchJson<{
          records: Array<
            Resident & { userId?: string; residenceStatus?: Resident['residenceStatus']; campusId?: string }
          >;
        }>(`/residents/read.php${residentCampusFilter}`),
        fetchJson<{ records: Array<Payment & { residentId?: string }> }>(`/applicant/read_payments.php${paymentFilter}`),
        user?.role === 'applicant'
          ? fetchJson<{ records: Array<{ id: string; message: string; createdAt?: string; sentAt?: string }> }>(
              `/notifications/read_for_user.php?userId=${user.id}&role=${user.role}`
            )
          : fetchJson<{ records: Array<{ id: string; message: string; sentAt: string; recipientGroup?: string }> }>(
              `/notifications/read.php`
            ),
        fetchJson<{ records: ResidentRequest[] }>(`/resident_requests/read.php${residentCampusFilter}`),
        loadCycles ? fetchJson<{ records: HousingCycle[] }>('/applications/read_cycles.php') : Promise.resolve(null),
        user?.role === 'chms_admin' ? fetchJson<{ records: Campus[] }>('/campuses/read.php') : Promise.resolve(null),
      ]);

      if (applicationsResult?.records) {
        setApplications(
          applicationsResult.records.map((app) => {
            const ext = app as Application & { cycleHouseImages?: unknown };
            const imgs = Array.isArray(ext.cycleHouseImages)
              ? (ext.cycleHouseImages as string[])
              : [];
            return {
              ...app,
              cycleId: app.cycleId != null ? String(app.cycleId) : undefined,
              status: (app.status === 'lottery_won' ? 'lottery' : app.status) as Application['status'],
              cycleHouseImages: imgs,
            };
          })
        );
      } else {
        setApplications([]);
      }

      if (cyclesResult?.records) {
        setHousingCycles(
          cyclesResult.records.map((c) => {
            const raw = c as HousingCycle & { houseImages?: unknown };
            const imgs = Array.isArray(raw.houseImages)
              ? (raw.houseImages as string[])
              : [];
            return {
              ...c,
              id: String((c as HousingCycle).id),
              campusId: c.campusId != null ? String(c.campusId) : null,
              blockId: c.blockId != null ? String(c.blockId) : null,
              monthlyPayment:
                c.monthlyPayment === null || c.monthlyPayment === undefined || c.monthlyPayment === ''
                  ? null
                  : Number(c.monthlyPayment),
              applicationFee:
                c.applicationFee === null || c.applicationFee === undefined || c.applicationFee === ''
                  ? null
                  : Number(c.applicationFee),
              bedrooms: c.bedrooms != null ? Number(c.bedrooms) : null,
              bathrooms: c.bathrooms != null ? Number(c.bathrooms) : null,
              status: c.status as HousingCycle['status'],
              houseImages: imgs,
            };
          })
        );
      } else {
        setHousingCycles([]);
      }

      if (blocksResult?.records) setBlocks(blocksResult.records);

      if (housesResult?.records) {
        setHouses(
          housesResult.records.map((house) => ({
            ...house,
            houseType: normalizeHouseType(
              (house as { house_type?: string }).house_type ?? house.houseType
            ),
            campusId: (house as { campusId?: string }).campusId
              ? String((house as { campusId?: string }).campusId)
              : undefined,
          }))
        );
      }

      if (residentsResult?.records) {
        setResidents(
          residentsResult.records.map((resident) => ({
            ...resident,
            applicantId: resident.applicantId ?? resident.userId ?? resident.id,
            residenceStatus: resident.residenceStatus ?? 'active',
            campusId: resident.campusId ? String(resident.campusId) : undefined,
          }))
        );
      }

      if (paymentsResult?.records) {
        setPayments(
          paymentsResult.records.map((payment) => ({
            ...payment,
            paymentStatus: (payment.paymentStatus ??
              (payment as unknown as { status?: Payment['paymentStatus'] }).status ??
              'pending') as Payment['paymentStatus'],
          }))
        );
      }

      if (notificationResult?.records) {
        setNotifications(
          notificationResult.records.map((item) => ({
            id: item.id,
            message: item.message,
            dateSent: item.sentAt ?? item.createdAt ?? new Date().toISOString(),
            type: 'info',
            recipient: 'all',
          }))
        );
      }

      if (requestsResult?.records) {
        setResidentRequests(
          requestsResult.records.map((req) => ({
            ...req,
            id: String(req.id),
            status: normalizeRequestStatus(String(req.status)),
            requestType: (req.requestType ?? 'other') as ResidentRequest['requestType'],
            priority: (req.priority ?? 'medium') as ResidentRequest['priority'],
          }))
        );
      }

      if (campusesResult?.records) setCampuses(campusesResult.records);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const addApplication = (application: Application) => {
    setApplications([...applications, application]);
  };

  const updateApplication = (id: string, updates: Partial<Application>) => {
    setApplications(
      applications.map((app) => (app.id === id ? { ...app, ...updates } : app))
    );
  };

  const addCampus = (campus: Campus) => setCampuses([...campuses, campus]);
  const updateCampus = (id: string, updates: Partial<Campus>) =>
    setCampuses(campuses.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  const deleteCampus = (id: string) => setCampuses(campuses.filter((c) => c.id !== id));

  const addBlock = (block: Block) => {
    setBlocks([...blocks, block]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const addHouse = (house: House) => {
    setHouses([...houses, house]);
  };

  const updateHouse = (id: string, updates: Partial<House>) => {
    setHouses(houses.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  };

  const deleteHouse = (id: string) => {
    setHouses(houses.filter((h) => h.id !== id));
  };

  const addResident = (resident: Resident) => {
    setResidents([...residents, resident]);
  };

  const updateResident = (id: string, updates: Partial<Resident>) => {
    setResidents(residents.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const addPayment = (payment: Payment) => {
    setPayments([...payments, payment]);
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setPayments(payments.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addNotification = (notification: Notification) => {
    setNotifications([...notifications, notification]);
  };

  const addFeedback = (fb: Feedback) => {
    setFeedback([...feedback, fb]);
  };

  const updateFeedback = (id: string, updates: Partial<Feedback>) => {
    setFeedback(feedback.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const addResidentRequest = (request: ResidentRequest) => {
    setResidentRequests([...residentRequests, request]);
  };

  const updateResidentRequest = (id: string, updates: Partial<ResidentRequest>) => {
    setResidentRequests(residentRequests.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  return (
    <DataContext.Provider
      value={{
        applications,
        housingCycles,
        addApplication,
        updateApplication,
        campuses,
        addCampus,
        updateCampus,
        deleteCampus,
        blocks,
        addBlock,
        updateBlock,
        deleteBlock,
        houses,
        addHouse,
        updateHouse,
        deleteHouse,
        residents,
        addResident,
        updateResident,
        payments,
        addPayment,
        updatePayment,
        notifications,
        addNotification,
        feedback,
        addFeedback,
        updateFeedback,
        residentRequests,
        addResidentRequest,
        updateResidentRequest,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}