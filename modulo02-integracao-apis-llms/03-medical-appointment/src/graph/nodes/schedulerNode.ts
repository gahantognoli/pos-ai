import { AppointmentService } from "../../services/appointmentService.ts";
import type { GraphState } from "../graph.ts";
import { z } from "zod/v3";

const ScheduleRequiredFieldSchema = z.object({
  professionalId: z.number({ required_error: "Professional ID is required" }),
  datetime: z.string({ required_error: "Datetime is required" }),
  patientName: z.string({ required_error: "Patient name is required" }),
});

export function createSchedulerNode(appointmentService: AppointmentService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`📅 Scheduling appointment...`);

    try {
      const validation = ScheduleRequiredFieldSchema.safeParse(state);
      if (!validation.success) {
        const errorMessages = validation.error.errors
          .map((err) => err.message)
          .join("; ");
        return {
          actionSuccess: false,
          actionError: `Validation failed: ${errorMessages}`,
        };
      }

      const appointment = appointmentService.bookAppointment(
        validation.data.professionalId,
        new Date(validation.data.datetime),
        validation.data.patientName,
        state.reason || "General Consultation",
      );

      console.log(`✅ Appointment scheduled successfully`);

      return {
        actionSuccess: true,
        appointmentData: appointment,
      };
    } catch (error) {
      console.log(
        `❌ Scheduling failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        ...state,
        actionSuccess: false,
        actionError:
          error instanceof Error ? error.message : "Scheduling failed",
      };
    }
  };
}
