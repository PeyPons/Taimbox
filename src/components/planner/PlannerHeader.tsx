/**
 * PlannerHeader Component
 * 
 * Renders the navigation and filter controls for the planner view.
 * Extracted from PlannerGrid for better separation of concerns.
 */

import { ChevronLeft, ChevronRight, CalendarDays, Sparkles, User, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getMonthName } from '@/utils/dateUtils';
import { Employee, Project } from '@/types';

interface PlannerHeaderProps {
    // Date navigation
    currentMonth: Date;
    year: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;

    // Filters
    selectedEmployeeId: string;
    selectedProjectId: string;
    showOnlyMe: boolean;
    onEmployeeChange: (id: string) => void;
    onProjectChange: (id: string) => void;
    onShowOnlyMeChange: (value: boolean) => void;

    // Data for dropdowns
    sortedEmployees: Employee[];
    sortedProjects: Project[];
    employees: Employee[];
    projects: Project[];
    filteredEmployeesCount: number;

    // Combo state
    openEmployeeCombo: boolean;
    openProjectCombo: boolean;
    onEmployeeComboChange: (open: boolean) => void;
    onProjectComboChange: (open: boolean) => void;

    // AI Insights slot (rendered as children)
    children?: React.ReactNode;
}

export function PlannerHeader({
    currentMonth,
    year,
    onPrevMonth,
    onNextMonth,
    onToday,
    selectedEmployeeId,
    selectedProjectId,
    showOnlyMe,
    onEmployeeChange,
    onProjectChange,
    onShowOnlyMeChange,
    sortedEmployees,
    sortedProjects,
    employees,
    projects,
    openEmployeeCombo,
    openProjectCombo,
    onEmployeeComboChange,
    onProjectComboChange,
    children
}: PlannerHeaderProps) {
    return (
        <div className="flex flex-col gap-4 border-b bg-card px-4 py-3 z-20 relative">
            {/* Top row: Month navigation + AI Insights */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold capitalize text-foreground flex items-center gap-2">
                        {getMonthName(currentMonth)}
                        <Badge variant="outline" className="text-xs font-normal hidden sm:flex">{year}</Badge>
                    </h2>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onToday} className="h-7 text-xs px-2">
                            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />Mes
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* AI Insights slot */}
                {children}
            </div>

            {/* Bottom row: Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Employee Filter */}
                    <Popover open={openEmployeeCombo} onOpenChange={onEmployeeComboChange}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="h-8 w-[200px] justify-between text-xs bg-white">
                                <span className="truncate">
                                    {selectedEmployeeId === 'all' ? "Todos" : employees.find(e => e.id === selectedEmployeeId)?.name}
                                </span>
                                <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Empleado..." />
                                <CommandList>
                                    <CommandGroup>
                                        <CommandItem onSelect={() => { onEmployeeChange('all'); onEmployeeComboChange(false); }}>
                                            Todos
                                        </CommandItem>
                                        {sortedEmployees.map(e => (
                                            <CommandItem key={e.id} onSelect={() => { onEmployeeChange(e.id); onEmployeeComboChange(false); }}>
                                                {e.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Project Filter */}
                    <Popover open={openProjectCombo} onOpenChange={onProjectComboChange}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="h-8 w-[200px] justify-between text-xs bg-white">
                                <span className="truncate">
                                    {selectedProjectId === 'all' ? "Todos" : projects.find(p => p.id === selectedProjectId)?.name}
                                </span>
                                <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Proyecto..." />
                                <CommandList>
                                    <CommandGroup>
                                        <CommandItem onSelect={() => { onProjectChange('all'); onProjectComboChange(false); }}>
                                            Todos
                                        </CommandItem>
                                        {sortedProjects.filter(p => p.status === 'active').map(p => (
                                            <CommandItem key={p.id} onSelect={() => { onProjectChange(p.id); onProjectComboChange(false); }}>
                                                {p.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Solo Yo Button */}
                    <Button
                        variant={showOnlyMe ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => onShowOnlyMeChange(!showOnlyMe)}
                        className={cn("h-8 text-xs gap-2", showOnlyMe && "bg-indigo-100 text-indigo-700")}
                    >
                        <User className="h-3.5 w-3.5" />Solo Yo
                    </Button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs hidden lg:flex">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">90-110%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        <span className="text-muted-foreground">&lt;90%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">&gt;110%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
