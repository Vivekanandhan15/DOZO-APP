"""
Timezone utilities for Indian Standard Time (IST) operations.
All datetime operations in the application should use these utilities.
"""
from datetime import datetime
import pytz

# Define IST timezone (UTC+5:30)
IST = pytz.timezone('Asia/Kolkata')


def get_ist_now():
    """
    Get current datetime in IST timezone.
    Returns a timezone-aware datetime object.
    
    Use this instead of datetime.utcnow() or datetime.now()
    """
    return datetime.now(IST)


def to_ist(dt):
    """
    Convert a datetime object to IST timezone.
    
    Args:
        dt: datetime object (can be naive or timezone-aware)
    
    Returns:
        Timezone-aware datetime in IST
    """
    if dt is None:
        return None
    
    # If naive datetime, assume it's UTC
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    
    # Convert to IST
    return dt.astimezone(IST)


def ist_aware(year, month, day, hour=0, minute=0, second=0, microsecond=0):
    """
    Create a timezone-aware datetime in IST.
    
    Args:
        year, month, day: Date components
        hour, minute, second, microsecond: Time components (optional)
    
    Returns:
        Timezone-aware datetime in IST
    """
    return IST.localize(datetime(year, month, day, hour, minute, second, microsecond))


def get_ist_date():
    """
    Get current date in IST timezone.
    
    Returns:
        date object representing today in IST
    """
    return get_ist_now().date()
