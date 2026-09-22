import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';

/**
 * Local replacement for the missing Replit-generated
 * @workspace/api-client-react package.
 *
 * This is intentionally self-contained and uses in-memory demo data.
 * It does not make network/API requests.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SessionUser = {
  id: string;
  name: string;
  initials: string;
  carePlan: string;
  dateOfBirth: string;
};

type Session = {
  authenticated: boolean;
  user: SessionUser;
};

type Vital = {
  id: string;
  recordedAt: string;
  heartRate: number;
  oxygen: number;
  temperature: number;
  hrv: number;
  source: string;
};

type AlertStatus = 'open' | 'acknowledged' | 'resolved';

type Alert = {
  id: string;
  status: AlertStatus;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  createdAt: string;
  source: string;
};

type Device = {
  id: string;
  name: string;
  model: string;
  transport: string;
  battery: number;
  lastSeen: string;
};

type CareTeamMember = {
  id: string;
  name: string;
  verified: boolean;
  role: string;
  organization: string;
  availability: string;
  channel: string;
};

type Consent = {
  id:
  | 'wearableData'
  | 'careTeamSharing'
  | 'emergencyEscalation'
  | 'modelAnalysis';
  label: string;
  description: string;
  required: boolean;
  enabled: boolean;
};

type Dashboard = {
  latest: {
  heartRate: number;
  oxygen: number;
  temperature: number;
  hrv: number;
  recordedAt: string;
};
  trend: string;
  riskScore: number;
  riskLabel: string;
  openAlertCount: number;
  deviceStatus: string;
  lastSyncedAt: string;
  patient: SessionUser;
};

type Insight = {
  id: string;
  confidence: number;
  title: string;
  summary: string;
  source: string;
  createdAt: string;
  disclaimer: string;
};

type EmergencyWorkflow = {
  id: string;
  createdAt: string;
  status: string;
  steps: {
    label: string;
    status: string;
  }[];
};

/* -------------------------------------------------------------------------- */
/* Demo data                                                                  */
/* -------------------------------------------------------------------------- */

const patient: SessionUser = {
  id: 'PG-2048',
  name: 'Maya Chen',
  initials: 'MC',
  carePlan: 'Daily monitoring',
  dateOfBirth: '1988-04-18',
};

let authenticated = false;

let alerts: Alert[] = [
  {
    id: 'alert-001',
    status: 'open',
    severity: 'high',
    title: 'Heart rate slightly above usual',
    detail:
      'Your recent heart-rate readings are a little higher than your recent personal pattern.',
    createdAt: '2026-06-18T09:42:00.000Z',
    source: 'PulseGuard Watch',
  },
  {
    id: 'alert-002',
    status: 'acknowledged',
    severity: 'medium',
    title: 'Lower HRV than usual',
    detail:
      'Heart-rate variability has been lower than your recent 7-day average.',
    createdAt: '2026-06-18T07:18:00.000Z',
    source: 'PulseGuard Watch',
  },
  {
    id: 'alert-003',
    status: 'resolved',
    severity: 'low',
    title: 'Device briefly disconnected',
    detail:
      'Your wearable temporarily stopped sending readings and has since reconnected.',
    createdAt: '2026-06-17T21:35:00.000Z',
    source: 'PulseGuard Watch',
  },
];

let devices: Device[] = [
  {
    id: 'device-001',
    name: 'PulseGuard Watch',
    model: 'PG Watch S1',
    transport: 'Bluetooth',
    battery: 78,
    lastSeen: '2026-06-18T10:08:00.000Z',
  },
];

let consents: Consent[] = [
  {
    id: 'wearableData',
    label: 'Wearable data',
    description:
      'Allow PulseGuard to collect and display signals from your connected wearable.',
    required: true,
    enabled: true,
  },
  {
    id: 'careTeamSharing',
    label: 'Care team sharing',
    description:
      'Allow approved care team members to view relevant monitoring signals.',
    required: false,
    enabled: true,
  },
  {
    id: 'emergencyEscalation',
    label: 'Emergency escalation',
    description:
      'Allow PulseGuard to start an emergency support workflow when requested.',
    required: false,
    enabled: true,
  },
  {
    id: 'modelAnalysis',
    label: 'Pattern analysis',
    description:
      'Allow signal patterns to be summarized into explainable insights.',
    required: false,
    enabled: true,
  },
];

const careTeam: CareTeamMember[] = [
  {
    id: 'care-001',
    name: 'Dr. Priya Raman',
    verified: true,
    role: 'Primary physician',
    organization: 'PulseCare Clinic',
    availability: 'Available today · 9 AM–6 PM',
    channel: 'secure message',
  },
  {
    id: 'care-002',
    name: 'Jordan Williams',
    verified: true,
    role: 'Care coordinator',
    organization: 'PulseCare Remote Monitoring',
    availability: 'Available today · 8 AM–8 PM',
    channel: 'secure message',
  },
  {
    id: 'care-003',
    name: 'Elena Garcia',
    verified: true,
    role: 'Nurse navigator',
    organization: 'PulseCare Clinic',
    availability: 'Available weekdays',
    channel: 'secure message',
  },
];

const insights: Insight[] = [
  {
    id: 'insight-001',
    confidence: 0.88,
    title: 'Your heart rate has been a little more active',
    summary:
      'Recent heart-rate readings are modestly higher than your recent personal pattern, especially during the morning period.',
    source: 'Heart-rate history',
    createdAt: '2026-06-18T10:00:00.000Z',
    disclaimer:
      'This pattern summary is informational and is not a medical diagnosis.',
  },
  {
    id: 'insight-002',
    confidence: 0.81,
    title: 'HRV is below your recent average',
    summary:
      'Your latest HRV readings are lower than the recent 7-day average. Looking at this alongside your own history provides more context than a single reading.',
    source: 'HRV history',
    createdAt: '2026-06-18T09:50:00.000Z',
    disclaimer:
      'This pattern summary is informational and is not a medical diagnosis.',
  },
];

/* -------------------------------------------------------------------------- */
/* Vital generation                                                           */
/* -------------------------------------------------------------------------- */

function createVitals(): Vital[] {
  const now = Date.now();

  const values = [
    { hr: 72, oxygen: 98, temp: 36.6, hrv: 54 },
    { hr: 74, oxygen: 98, temp: 36.7, hrv: 52 },
    { hr: 76, oxygen: 97, temp: 36.7, hrv: 49 },
    { hr: 78, oxygen: 98, temp: 36.8, hrv: 47 },
    { hr: 75, oxygen: 98, temp: 36.7, hrv: 51 },
    { hr: 80, oxygen: 97, temp: 36.8, hrv: 45 },
    { hr: 82, oxygen: 98, temp: 36.9, hrv: 44 },
    { hr: 79, oxygen: 98, temp: 36.8, hrv: 46 },
    { hr: 77, oxygen: 98, temp: 36.7, hrv: 50 },
    { hr: 74, oxygen: 99, temp: 36.6, hrv: 55 },
    { hr: 73, oxygen: 98, temp: 36.6, hrv: 57 },
    { hr: 76, oxygen: 98, temp: 36.7, hrv: 53 },
    { hr: 81, oxygen: 97, temp: 36.8, hrv: 48 },
    { hr: 84, oxygen: 97, temp: 36.9, hrv: 43 },
    { hr: 82, oxygen: 98, temp: 36.8, hrv: 45 },
    { hr: 79, oxygen: 98, temp: 36.7, hrv: 49 },
    { hr: 77, oxygen: 99, temp: 36.6, hrv: 52 },
    { hr: 75, oxygen: 98, temp: 36.6, hrv: 55 },
    { hr: 73, oxygen: 98, temp: 36.5, hrv: 58 },
    { hr: 72, oxygen: 99, temp: 36.5, hrv: 60 },
  ];

  return values.map((value, index) => ({
    id: `vital-${index + 1}`,
    recordedAt: new Date(
      now - (values.length - 1 - index) * 60 * 60 * 1000,
    ).toISOString(),
    heartRate: value.hr,
    oxygen: value.oxygen,
    temperature: value.temp,
    hrv: value.hrv,
    source: 'PulseGuard Watch',
  }));
}

let vitals: Vital[] = createVitals();

/* -------------------------------------------------------------------------- */
/* Query keys                                                                 */
/* -------------------------------------------------------------------------- */

export function getGetConsentsQueryKey(): QueryKey {
  return ['/api/consents'];
}

export function getGetVitalsQueryKey(options?: {
  range?: '24h' | '7d' | '30d';
}): QueryKey {
  return ['/api/vitals', options?.range ?? '7d'];
}

export function getListAlertsQueryKey(): QueryKey {
  return ['/api/alerts'];
}

/* -------------------------------------------------------------------------- */
/* Helper functions                                                           */
/* -------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSession(): Session {
  return {
    authenticated,
    user: patient,
  };
}

function getDashboard(): Dashboard {
  const latest = vitals[vitals.length - 1];

  const openAlertCount = alerts.filter(
    alert => alert.status === 'open',
  ).length;

  return {
     latest: {
  heartRate: latest?.heartRate ?? 76,
  oxygen: latest?.oxygen ?? 98,
  temperature: latest?.temperature ?? 36.7,
  hrv: latest?.hrv ?? 52,
  recordedAt: latest?.recordedAt ?? new Date().toISOString(),
},
    trend: 'Up slightly',
    riskScore: 86,
    riskLabel: 'Within usual range',
    openAlertCount,
    deviceStatus: devices.length ? 'Connected' : 'Not connected',
    lastSyncedAt:
      devices[0]?.lastSeen ?? new Date().toISOString(),
    patient,
  };
}

function getVitals(
  range: '24h' | '7d' | '30d' = '7d',
): Vital[] {
  if (range === '24h') {
    return vitals.slice(-24);
  }

  if (range === '30d') {
    return vitals;
  }

  return vitals.slice(-20);
}

function syncDevice(deviceId: string): Device | undefined {
  const device = devices.find(item => item.id === deviceId);

  if (!device) {
    return undefined;
  }

  device.lastSeen = new Date().toISOString();

  // Add a fresh reading to make the Sync button visibly useful.
  const previous = vitals[vitals.length - 1];

  vitals.push({
    id: `vital-${Date.now()}`,
    recordedAt: new Date().toISOString(),
    heartRate: Math.max(
      60,
      Math.min(95, (previous?.heartRate ?? 76) + Math.floor(Math.random() * 7) - 3),
    ),
    oxygen: 98,
    temperature: 36.7,
    hrv: Math.max(
      35,
      Math.min(70, (previous?.hrv ?? 52) + Math.floor(Math.random() * 7) - 3),
    ),
    source: 'PulseGuard Watch',
  });

  return device;
}

/* -------------------------------------------------------------------------- */
/* useGetSession                                                              */
/* -------------------------------------------------------------------------- */

export function useGetSession(options?: {
  query?: {
    queryKey?: QueryKey;
    staleTime?: number;
    retry?: boolean | number;
    enabled?: boolean;
  };
}) {
  return useQuery<Session>({
    queryKey: options?.query?.queryKey ?? ['/api/session'],
    queryFn: async () => {
      await sleep(150);
      return getSession();
    },
    staleTime: options?.query?.staleTime,
    retry: options?.query?.retry ?? false,
    enabled: options?.query?.enabled ?? true,
  });
}

/* -------------------------------------------------------------------------- */
/* useStartDemoSession                                                        */
/* -------------------------------------------------------------------------- */

export function useStartDemoSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await sleep(500);

      authenticated = true;

      return getSession();
    },

    onSuccess: session => {
      queryClient.setQueryData(['/api/session'], session);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useGetDashboard                                                            */
/* -------------------------------------------------------------------------- */

export function useGetDashboard() {
  return useQuery<Dashboard>({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      await sleep(250);
      return getDashboard();
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useGetVitals                                                               */
/* -------------------------------------------------------------------------- */

export function useGetVitals(options?: {
  range?: '24h' | '7d' | '30d';
}) {
  const range = options?.range ?? '7d';

  return useQuery<Vital[]>({
    queryKey: getGetVitalsQueryKey({ range }),
    queryFn: async () => {
      await sleep(200);
      return getVitals(range);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useListAlerts                                                              */
/* -------------------------------------------------------------------------- */

export function useListAlerts() {
  return useQuery<Alert[]>({
    queryKey: getListAlertsQueryKey(),
    queryFn: async () => {
      await sleep(180);
      return [...alerts];
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useListDevices                                                             */
/* -------------------------------------------------------------------------- */

export function useListDevices() {
  return useQuery<Device[]>({
    queryKey: ['/api/devices'],
    queryFn: async () => {
      await sleep(150);
      return [...devices];
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useSyncDevice                                                              */
/* -------------------------------------------------------------------------- */

export function useSyncDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      data: {
        deviceId: string;
      };
    }) => {
      await sleep(700);

      const device = syncDevice(input.data.deviceId);

      if (!device) {
        throw new Error('Device not found');
      }

      return device;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/devices'],
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard'],
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/vitals'],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useUpdateAlert                                                             */
/* -------------------------------------------------------------------------- */

export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      alertId: string;
      data: {
        status: 'acknowledged' | 'resolved';
      };
    }) => {
      await sleep(250);

      const alert = alerts.find(item => item.id === input.alertId);

      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.status = input.data.status;

      return alert;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getListAlertsQueryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard'],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useGetCareTeam                                                             */
/* -------------------------------------------------------------------------- */

export function useGetCareTeam() {
  return useQuery<CareTeamMember[]>({
    queryKey: ['/api/care-team'],
    queryFn: async () => {
      await sleep(200);
      return [...careTeam];
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useGetConsents                                                             */
/* -------------------------------------------------------------------------- */

export function useGetConsents() {
  return useQuery<Consent[]>({
    queryKey: getGetConsentsQueryKey(),
    queryFn: async () => {
      await sleep(180);
      return [...consents];
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useUpdateConsents                                                          */
/* -------------------------------------------------------------------------- */

export function useUpdateConsents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      data: {
        wearableData: boolean;
        careTeamSharing: boolean;
        emergencyEscalation: boolean;
        modelAnalysis: boolean;
      };
    }) => {
      await sleep(250);

      const values = input.data;

      consents = consents.map(consent => {
        switch (consent.id) {
          case 'wearableData':
            return {
              ...consent,
              enabled: consent.required ? true : values.wearableData,
            };

          case 'careTeamSharing':
            return {
              ...consent,
              enabled: values.careTeamSharing,
            };

          case 'emergencyEscalation':
            return {
              ...consent,
              enabled: values.emergencyEscalation,
            };

          case 'modelAnalysis':
            return {
              ...consent,
              enabled: values.modelAnalysis,
            };

          default:
            return consent;
        }
      });

      return [...consents];
    },

    onSuccess: updatedConsents => {
      queryClient.setQueryData(
        getGetConsentsQueryKey(),
        updatedConsents,
      );
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useEscalateEmergency                                                       */
/* -------------------------------------------------------------------------- */

export function useEscalateEmergency() {
  return useMutation({
    mutationFn: async (input: {
      data: {
        reason: string;
        channel: 'care-team' | 'emergency-services';
      };
    }): Promise<EmergencyWorkflow> => {
      await sleep(800);

      const isEmergency =
        input.data.channel === 'emergency-services';

      const workflow: EmergencyWorkflow = {
        id: `WF-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        status: 'In progress',
        steps: [
          {
            label: 'Request received',
            status: 'Completed',
          },
          {
            label: isEmergency
              ? 'Emergency services notified'
              : 'Care team notified',
            status: 'Completed',
          },
          {
            label: 'Follow-up',
            status: 'Pending',
          },
        ],
      };

      return workflow;
    },
  });
}

/* -------------------------------------------------------------------------- */
/* useGetModelInsights                                                        */
/* -------------------------------------------------------------------------- */

export function useGetModelInsights() {
  return useQuery<Insight[]>({
    queryKey: ['/api/model-insights'],
    queryFn: async () => {
      await sleep(250);
      return [...insights];
    },
  });
}