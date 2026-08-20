// page/kaldikData.js
// NOTE: sesuaikan path import supabase client di bawah ini kalau lokasi
// supabaseClient.js di project lo bukan di src/supabaseClient.js
import { supabase } from "../supabaseClient";
import { useState, useEffect, useCallback } from "react";

// Kalo end_date kosong, samain sama start_date (event 1 hari)
function normalizeEventPayload(payload) {
  return {
    ...payload,
    end_date: payload.end_date || payload.start_date,
  };
}

export async function fetchEventCategories() {
  const { data, error } = await supabase
    .from("event_categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function fetchKaldikDocument(academicYear) {
  const { data, error } = await supabase
    .from("kaldik_documents")
    .select("*")
    .eq("academic_year", academicYear)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data; // null kalo belum ada dokumen di-upload
}

export async function fetchAcademicEvents({ academicYear, semester } = {}) {
  let query = supabase
    .from("academic_events")
    .select("*, event_categories(id, name, color)")
    .order("start_date");

  if (academicYear) query = query.eq("academic_year", academicYear);
  if (semester) query = query.eq("semester", semester);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createAcademicEvent(payload, userId) {
  const { data, error } = await supabase
    .from("academic_events")
    .insert({ ...normalizeEventPayload(payload), created_by: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAcademicEvent(id, payload) {
  const { data, error } = await supabase
    .from("academic_events")
    .update({
      ...normalizeEventPayload(payload),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAcademicEvent(id) {
  const { error } = await supabase
    .from("academic_events")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// Hook buat manage state di KaldikPage
export function useKaldikEvents({ academicYear, semester }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, categoriesData] = await Promise.all([
        fetchAcademicEvents({ academicYear, semester }),
        fetchEventCategories(),
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [academicYear, semester]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { events, categories, loading, error, refetch: loadData };
}
