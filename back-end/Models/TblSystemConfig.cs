using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblSystemConfig
{
    public string ConfigKey { get; set; } = null!;

    public string? ConfigValue { get; set; }

    public string? Description { get; set; }
}
