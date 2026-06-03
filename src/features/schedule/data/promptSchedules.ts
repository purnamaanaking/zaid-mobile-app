import { PromptSchedule } from '@/src/types/schedule.types';

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

export function buildPromptSchedules(today: Date): PromptSchedule[] {
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(addDays(today, 1));
  const dayAfterTomorrowKey = dateKey(addDays(today, 2));
  const fourDaysLaterKey = dateKey(addDays(today, 4));
  const nextWeekKey = dateKey(addDays(today, 7));
  const createdAt = addDays(today, -1).toISOString();

  return [
    {
      id: 'schedule-1',
      userId: 'user-1',
      title: 'Meeting Client',
      date: todayKey,
      time: '19:00',
      endTime: '20:00',
      location: 'Google Meet',
      description: 'Review scope dashboard dan validasi kebutuhan kalender.',
      reminderMinutes: 30,
      recurring: 'none',
      status: 'active',
      sourcePrompt: 'Hari ini jam 7 malam meeting client bahas dashboard via Google Meet.',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'schedule-2',
      userId: 'user-1',
      title: 'Rapat Koordinasi',
      date: todayKey,
      endDate: dayAfterTomorrowKey, // Spans 3 days: today, tomorrow, day after tomorrow
      time: '13:30',
      endTime: '14:30',
      location: 'Ruang B204',
      description: 'Rapat koordinasi berkala sinkronisasi jadwal penelitian.',
      reminderMinutes: 15,
      recurring: 'none',
      status: 'active',
      sourcePrompt: 'Rapat koordinasi penelitian dari hari ini sampai lusa jam setengah dua siang.',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'schedule-3',
      userId: 'user-1',
      title: 'Submit Proposal',
      date: tomorrowKey,
      time: '09:00',
      endTime: '10:00',
      location: 'Portal Kampus',
      description: 'Final check dokumen dan unggah proposal penelitian.',
      reminderMinutes: 60,
      recurring: 'weekly',
      status: 'active',
      sourcePrompt: 'Besok pagi jam 9 ingatkan submit proposal di portal kampus.',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'schedule-4',
      userId: 'user-1',
      title: 'Review Sprint',
      date: nextWeekKey,
      time: '15:00',
      endTime: '16:00',
      location: 'Studio Product',
      description: 'Evaluasi task AI prompt dan prioritas integrasi calendar sync.',
      reminderMinutes: 45,
      recurring: 'weekly',
      status: 'active',
      sourcePrompt: 'Minggu depan jam 3 sore review sprint untuk integrasi calendar sync.',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'schedule-5',
      userId: 'user-1',
      title: 'AI Training Workshop',
      date: dayAfterTomorrowKey,
      endDate: fourDaysLaterKey, // Spans 3 days: day after tomorrow to 4 days later
      time: '09:00',
      endTime: '17:00',
      location: 'Auditorium Utama',
      description: 'Workshop intensif pengembangan aplikasi mobile terintegrasi kecerdasan buatan.',
      reminderMinutes: 60,
      recurring: 'none',
      status: 'active',
      sourcePrompt: 'Penyelenggaraan workshop training AI dari lusa sampai 4 hari lagi jam 9 pagi sampai 5 sore.',
      createdAt,
      updatedAt: createdAt,
    },
  ];
}
