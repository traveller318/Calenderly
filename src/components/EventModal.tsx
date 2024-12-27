import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Event } from '../utils/types';
import { Clock, CalendarIcon, Type, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete: (eventId: string) => void;
  selectedDate: Date;
  editingEvent: Event | null;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  editingEvent,
}) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endTime, setEndTime] = useState('');
  const [endPeriod, setEndPeriod] = useState('AM');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Event['category']>('other');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEvent) {
      const startDate = new Date(editingEvent.startTime);
      const endDate = new Date(editingEvent.endTime);
      
      setTitle(editingEvent.title);
      const startHours = startDate.getHours();
      const startMinutes = startDate.getMinutes();
      const endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();

      // Convert to 12-hour format
      setStartTime(
        `${(startHours % 12 || 12).toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`
      );
      setStartPeriod(startHours >= 12 ? 'PM' : 'AM');

      setEndTime(
        `${(endHours % 12 || 12).toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
      );
      setEndPeriod(endHours >= 12 ? 'PM' : 'AM');

      setDescription(editingEvent.description || '');
      setCategory(editingEvent.category);
    } else {
      setTitle('');
      setStartTime('09:00');
      setStartPeriod('AM');
      setEndTime('10:00');
      setEndPeriod('AM');
      setDescription('');
      setCategory('other');
    }
    setError(null);
  }, [editingEvent, selectedDate]);

  const convertTo24Hour = (time: string, period: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) hours24 += 12;
    if (period === 'AM' && hours === 12) hours24 = 0;
    return hours24 * 60 + minutes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert times to minutes since midnight for comparison
    const startMinutes = convertTo24Hour(startTime, startPeriod);
    const endMinutes = convertTo24Hour(endTime, endPeriod);

    // Handle next day scenarios
    let adjustedEndMinutes = endMinutes;
    if (endMinutes < startMinutes) {
      adjustedEndMinutes += 24 * 60; // Add 24 hours worth of minutes
    }

    if (adjustedEndMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }

    const newStartTime = new Date(selectedDate);
    const [startHours, startMins] = startTime.split(':').map(Number);
    let adjustedStartHours = startHours;
    if (startPeriod === 'PM' && startHours !== 12) {
      adjustedStartHours += 12;
    } else if (startPeriod === 'AM' && startHours === 12) {
      adjustedStartHours = 0;
    }
    newStartTime.setHours(adjustedStartHours, startMins);

    const newEndTime = new Date(selectedDate);
    const [endHours, endMins] = endTime.split(':').map(Number);
    let adjustedEndHours = endHours;
    if (endPeriod === 'PM' && endHours !== 12) {
      adjustedEndHours += 12;
    } else if (endPeriod === 'AM' && endHours === 12) {
      adjustedEndHours = 0;
    }
    
    // If end time is earlier than start time, it's meant for the next day
    if (adjustedEndHours < adjustedStartHours || 
       (adjustedEndHours === adjustedStartHours && endMins < startMins)) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }
    newEndTime.setHours(adjustedEndHours, endMins);

    const event: Event = {
      id: editingEvent ? editingEvent.id : Date.now().toString(),
      title,
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
      description,
      category,
    };
    onSave(event);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Event Name
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <div className="flex gap-2">
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                  className="flex-grow"
                />
                <Select value={startPeriod} onValueChange={setStartPeriod}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </Label>
              <div className="flex gap-2">
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                  className="flex-grow"
                />
                <Select value={endPeriod} onValueChange={setEndPeriod}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </Label>
            <Select value={category} onValueChange={(value: Event['category']) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="hobbies">Hobbies</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="h-24"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter className="sm:justify-between">
            {editingEvent && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(editingEvent.id)}
              >
                Delete Event
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{editingEvent ? 'Update' : 'Add'} Event</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;