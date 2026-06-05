"use server";

import {
  addExerciseLog,
  createExercise,
  updateBodyweight,
} from "@/lib/fitness";
import { requireUser } from "@/lib/session";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createExerciseAction(formData: FormData) {
  const session = await requireUser();

  await createExercise(session.user.id, {
    name: getString(formData, "name"),
    measurementType: getString(formData, "measurementType") as
      | "reps"
      | "distance"
      | "duration"
      | "weight",
    unit: getString(formData, "unit"),
    trackBodyweight: formData.get("trackBodyweight") === "on",
    notes: getString(formData, "notes") || undefined,
  });
}

export async function addExerciseLogAction(formData: FormData) {
  const session = await requireUser();
  const performedAt = getString(formData, "performedAt");

  await addExerciseLog(session.user.id, {
    exerciseId: getString(formData, "exerciseId"),
    value: Number(getString(formData, "value")),
    performedAt: performedAt ? new Date(performedAt) : undefined,
    note: getString(formData, "note") || undefined,
  });
}

export async function updateBodyweightAction(formData: FormData) {
  const session = await requireUser();

  await updateBodyweight(session.user.id, {
    weightKg: Number(getString(formData, "weightKg")),
  });
}
