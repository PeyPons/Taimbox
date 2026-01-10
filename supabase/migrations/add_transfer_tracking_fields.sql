ALTER TABLE allocations
ADD COLUMN original_transferred_task_name text,
ADD COLUMN transfer_source_employee_id uuid REFERENCES employees(id);

-- Add comment
COMMENT ON COLUMN allocations.original_transferred_task_name IS 'Snapshot of the original task name at the moment of transfer/distribution, used for tracking lineage without relying on the mutable task_name column.';
COMMENT ON COLUMN allocations.transfer_source_employee_id IS 'ID of the employee who owned the task before it was transferred or distributed to the current owner.';
