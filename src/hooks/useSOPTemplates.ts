import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { SOPTemplate, SOPItem } from '@/types';
import { toast } from 'sonner';

interface SOPTemplateRow {
  id: string;
  agency_id: string;
  name: string;
  platform: string | null;
  items: Omit<SOPItem, 'isCompleted'>[];
  created_at: string;
}

function mapRow(row: SOPTemplateRow): SOPTemplate {
  return {
    id: row.id,
    agencyId: row.agency_id,
    name: row.name,
    platform: row.platform || undefined,
    items: row.items || [],
    createdAt: row.created_at,
  };
}

export function useSOPTemplates() {
  const { currentAgency } = useAgency();
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    if (!currentAgency?.id) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sop_templates')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .order('name');

      if (error) {
        if (error.code === '42P01') {
          setTemplates([]);
          setIsLoading(false);
          return;
        }
        throw error;
      }

      setTemplates((data || []).map(mapRow));
    } catch (error) {
      console.error('[useSOPTemplates] Error loading templates:', error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentAgency?.id]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const createTemplate = useCallback(async (
    name: string,
    items: Omit<SOPItem, 'isCompleted'>[],
    platform?: string
  ): Promise<SOPTemplate | null> => {
    if (!currentAgency?.id) return null;

    try {
      const { data, error } = await supabase
        .from('sop_templates')
        .insert({
          agency_id: currentAgency.id,
          name,
          platform: platform || null,
          items,
        })
        .select()
        .single();

      if (error) throw error;

      const newTemplate = mapRow(data);
      setTemplates(prev => [...prev, newTemplate].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Plantilla creada');
      return newTemplate;
    } catch (error) {
      console.error('[useSOPTemplates] Error creating template:', error);
      toast.error('Error al crear la plantilla');
      return null;
    }
  }, [currentAgency?.id]);

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sop_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Plantilla eliminada');
      return true;
    } catch (error) {
      console.error('[useSOPTemplates] Error deleting template:', error);
      toast.error('Error al eliminar la plantilla');
      return false;
    }
  }, []);

  return {
    templates,
    isLoading,
    createTemplate,
    deleteTemplate,
    refreshTemplates: loadTemplates,
  };
}
