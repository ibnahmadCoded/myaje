from datetime import datetime, timedelta
from typing import Literal

ScheduleType = Literal["daily", "weekly", "biweekly", "monthly"]

def calculate_next_run(schedule: ScheduleType) -> datetime:
    """
    Calculate the next run date based on the schedule type.
    
    Args:
        schedule: The schedule type ("daily", "weekly", "biweekly", or "monthly")
        
    Returns:
        datetime: The next scheduled run date
    """
    current_date = datetime.now()
    
    match schedule:
        case "daily":
            # Next day at the same time
            next_run = current_date + timedelta(days=1)
        
        case "weekly":
            # Next week at the same time
            next_run = current_date + timedelta(weeks=1)
        
        case "biweekly":
            # Two weeks from now at the same time
            next_run = current_date + timedelta(weeks=2)
        
        case "monthly":
            # Add a month by calculating the next month's date
            # Handle edge cases like end of month
            year = current_date.year
            month = current_date.month + 1
            
            # Handle year rollover
            if month > 12:
                month = 1
                year += 1
                
            # Try to maintain the same day of month, but handle edge cases
            # (e.g., March 31 -> April 30)
            try:
                next_run = current_date.replace(year=year, month=month)
            except ValueError:
                # If the day doesn't exist in the target month, use the last day
                if month + 1 > 12:
                    next_month = current_date.replace(year=year + 1, month=1)
                else:
                    next_month = current_date.replace(year=year, month=month + 1)
                next_run = next_month - timedelta(days=next_month.day)
        
        case _:
            raise ValueError(f"Invalid schedule type: {schedule}")
    
    # Set the time to midnight of the next run date
    next_run = next_run.replace(hour=0, minute=0, second=0, microsecond=0)
    
    return next_run