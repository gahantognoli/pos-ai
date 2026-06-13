import { AppointmentService } from '../../services/appointmentService.ts';
import type { GraphState } from '../graph.ts';
import { z } from 'zod/v3';

const CancelRequiredFieldSchema = z.object({
  professionalId: z.number({ required_error: "Professional ID is required" }),
  datetime: z.string({ required_error: "Datetime is required" }),
  patientName: z.string({ required_error: "Patient name is required" }),
});

export function createCancellerNode(appointmentService: AppointmentService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`❌ Cancelling appointment...`);

    try {
      const validation = CancelRequiredFieldSchema.safeParse(state);
      if (!validation.success) {
        const errorMessages = validation.error.errors
          .map((err) => err.message)
          .join("; ");
        return {
          actionSuccess: false,
          actionError: `Validation failed: ${errorMessages}`,
        };
      }

      const appointment = appointmentService.cancelAppointment(
        validation.data.professionalId,
        validation.data.patientName,
        new Date(validation.data.datetime),
      );

      console.log(`✅ Appointment cancelled successfully`);

      return {
        actionSuccess: true,
        appointmentData: appointment,
      };
    } catch (error) {
      console.log(`❌ Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        ...state,
        actionSuccess: false,
        actionError: error instanceof Error ? error.message : 'Cancellation failed',
      };
    }
  };
}
