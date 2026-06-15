import { Button, DatePicker, Input, Portal } from "@chakra-ui/react"
import {
  CalendarDateTime,
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
} from "@internationalized/date"
import { useState, useEffect } from "react"
import { Calendar as LuCalendar } from "lucide-react"

const formatter = new DateFormatter("id-ID", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

interface ChakraDatePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
}

export const ChakraDatePicker = ({ label = "Pilih Tanggal & Waktu", value, onChange, placeholder = "Pilih tanggal dan waktu" }: ChakraDatePickerProps) => {
  const [internalValue, setInternalValue] = useState<CalendarDateTime[]>([])

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setInternalValue([new CalendarDateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes())]);
      }
    } else {
      setInternalValue([]);
    }
  }, [value]);

  const timeValue = internalValue[0]
    ? `${String(internalValue[0].hour).padStart(2, "0")}:${String(internalValue[0].minute).padStart(2, "0")}`
    : ""

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.currentTarget.value.split(":").map(Number)
    const current = internalValue[0] ?? new CalendarDateTime(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate(), 0, 0)
    const next = [current.set({ hour: hours || 0, minute: minutes || 0 })];
    setInternalValue(next)
    if (onChange && next[0]) {
      const d = new Date(next[0].year, next[0].month - 1, next[0].day, next[0].hour, next[0].minute);
      onChange(d);
    }
  }

  const onDateChange = (details: { value: DateValue[] }) => {
    const newDate = details.value[0]
    if (!newDate) {
      setInternalValue([])
      if (onChange) onChange(null);
      return;
    }
    const prevTime = internalValue[0] ?? { hour: 0, minute: 0 }
    const next = [
      new CalendarDateTime(
        newDate.year,
        newDate.month,
        newDate.day,
        prevTime.hour,
        prevTime.minute,
      ),
    ]
    setInternalValue(next)
    if (onChange && next[0]) {
      const d = new Date(next[0].year, next[0].month - 1, next[0].day, next[0].hour, next[0].minute);
      onChange(d);
    }
  }

  return (
    <DatePicker.Root
      value={internalValue}
      onValueChange={onDateChange}
      closeOnSelect={false}
      width="full"
    >
      <DatePicker.Control>
        <DatePicker.Trigger asChild unstyled>
          <Button variant="outline" width="full" justifyContent="space-between" fontWeight="normal" color="gray.700">
            {internalValue[0]
              ? formatter.format(internalValue[0].toDate(getLocalTimeZone()))
              : placeholder}
            <LuCalendar size={16} />
          </Button>
        </DatePicker.Trigger>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content bg="white" p={4} borderRadius="xl" shadow="xl" border="1px solid" borderColor="gray.100">
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
              <Input type="time" value={timeValue} onChange={onTimeChange} mt={3} borderRadius="lg" />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  )
}
