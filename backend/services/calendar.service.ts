import * as ics from 'ics';

interface Applicant {
  firstName: string;
  lastName: string;
  email: string;
  interviewNotes?: string | null;
  interviewPlatform?: string | null;
  interviewLink?: string | null;
}

/**
 * Generates an ICS (iCalendar) file for an interview schedule.
 * @param applicant The applicant object containing details.
 * @param stage The current recruitment stage.
 * @param date The scheduled date for the interview.
 * @returns A promise that resolves to the ICS string content or null if failed.
 */
export const generateInterviewICS = async (
  applicant: Applicant,
  stage: string,
  date: string | Date
): Promise<string | null> => {
  try {
    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.warn('[CalendarService] Invalid date provided for ICS generation:', date);
      return null;
    }

    // ics.createEvent expects [year, month, day, hour, minute]. Months are 1-indexed.
    const startTime: ics.DateArray = [
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      d.getHours(),
      d.getMinutes()
    ];

    const event: ics.EventAttributes = {
      start: startTime,
      duration: { hours: 1, minutes: 0 },
      title: `Interview: ${applicant.firstName} ${applicant.lastName} (${stage})`,
      description: `Interview for the recruitment process of City Human Resources Management Office.\n\nNotes: ${applicant.interviewNotes || 'No additional notes provided.'}`,
      location: applicant.interviewPlatform || 'Online',
      url: applicant.interviewLink || undefined,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'CHRM Office', email: 'capstone682@gmail.com' },
      attendees: [
        { 
          name: `${applicant.firstName} ${applicant.lastName}`, 
          email: applicant.email, 
          rsvp: true, 
          role: 'REQ-PARTICIPANT' 
        }
      ]
    };

    return new Promise((resolve) => {
      ics.createEvent(event, (error, value) => {
        if (error) {
          console.error('[CalendarService] Error creating ICS event:', error);
          resolve(null);
        }
        resolve(value);
      });
    });
  } catch (error) {
    console.error('[CalendarService] Failed to generate ICS:', error);
    return null;
  }
};
