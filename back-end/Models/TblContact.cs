using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblContact
{
    public int ContactId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string? Subject { get; set; }

    public string Message { get; set; } = null!;

    public string? Status { get; set; }

    public DateTime? SentAt { get; set; }
}
