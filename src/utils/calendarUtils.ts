/**
 * Enterprise Google Calendar & iCalendar (.ics) Utilities
 */

export interface CalendarEventOptions {
  title: string;
  description?: string;
  location?: string;
  startDate: Date | string;
  endDate?: Date | string;
  allDay?: boolean;
}

/**
 * Format a Date object to Google Calendar ISO string (YYYYMMDDTHHmmssZ)
 */
export const formatGoogleCalendarDate = (date: Date, allDay: boolean = false): string => {
  if (allDay) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Generate a 1-click Google Calendar Event creation URL
 */
export const createGoogleCalendarUrl = (options: CalendarEventOptions): string => {
  const start = new Date(options.startDate);
  const end = options.endDate ? new Date(options.endDate) : new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour

  const datesParam = options.allDay
    ? `${formatGoogleCalendarDate(start, true)}/${formatGoogleCalendarDate(end, true)}`
    : `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates: datesParam,
    details: options.description || '',
    location: options.location || 'Google Meet / Online'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate iCalendar (.ics) file content
 */
export const createIcsFileContent = (options: CalendarEventOptions): string => {
  const start = new Date(options.startDate);
  const end = options.endDate ? new Date(options.endDate) : new Date(start.getTime() + 60 * 60 * 1000);

  const startFormatted = formatGoogleCalendarDate(start, options.allDay);
  const endFormatted = formatGoogleCalendarDate(end, options.allDay);
  const nowFormatted = formatGoogleCalendarDate(new Date());

  const uid = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}@sumrday.site`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//sumr.day Creative Digital Studio//Booking System//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowFormatted}`,
    options.allDay ? `DTSTART;VALUE=DATE:${startFormatted}` : `DTSTART:${startFormatted}`,
    options.allDay ? `DTEND;VALUE=DATE:${endFormatted}` : `DTEND:${endFormatted}`,
    `SUMMARY:${options.title.replace(/\n/g, '\\n')}`,
    `DESCRIPTION:${(options.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${(options.location || 'Google Meet').replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

/**
 * Trigger immediate browser download of an .ics file
 */
export const downloadIcsFile = (filename: string, icsContent: string): void => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate Google Calendar URL specifically for Project Management (Deadline or Client Review)
 */
export const generateProjectCalendarEvent = (
  project: any,
  type: 'deadline' | 'review' | 'milestone' = 'deadline'
): { googleUrl: string; icsContent: string } => {
  const projectTitle = project.title || project.name || 'Proyek sumr.day';
  const clientName = project.client || project.clientName || 'Klien';
  
  let title = '';
  let description = '';
  let startDate: Date;
  let endDate: Date;
  let allDay = false;

  if (type === 'deadline') {
    title = `🎯 Deadline: ${projectTitle} (${clientName})`;
    startDate = project.deadline ? new Date(project.deadline) : new Date();
    endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    description = `Target penyelesaian proyek: ${projectTitle}\nKlien: ${clientName}\nStatus: ${project.status || 'In Progress'}\nPrioritas: ${project.priority || 'Medium'}\n\nCatatan Proyek:\n${project.description || '-'}`;
  } else if (type === 'review') {
    title = `🤝 Client Review & Meeting: ${projectTitle}`;
    startDate = new Date();
    startDate.setHours(startDate.getHours() + 24); // default besok
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 jam
    description = `Agenda Review Hasil Proyek bersama ${clientName}.\nProyek: ${projectTitle}\nPlatform: Google Meet\n\nLink Dashboard CMS: ${window.location.origin}/admin`;
  } else {
    title = `🚩 Milestone Checkpoint: ${projectTitle}`;
    startDate = project.deadline ? new Date(project.deadline) : new Date();
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    description = `Evaluasi kemajuan pengerjaan proyek: ${projectTitle}\nKlien: ${clientName}`;
  }

  const options: CalendarEventOptions = {
    title,
    description,
    startDate,
    endDate,
    allDay,
    location: 'Google Meet / Online Meeting'
  };

  return {
    googleUrl: createGoogleCalendarUrl(options),
    icsContent: createIcsFileContent(options)
  };
};
