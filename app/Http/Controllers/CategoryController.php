<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\CategoryDimension;
use App\Models\CategoryOption;
use App\Models\Stream;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Add new dimension to stream.
     */
    public function storeDimension(Request $request, Stream $stream): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:30'],
            'name' => ['required', 'string', 'max:100'],
            'code_order' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $dim = $stream->categoryDimensions()->create([
            'code' => strtoupper(trim($request->input('code'))),
            'name' => trim($request->input('name')),
            'code_order' => $request->input('code_order'),
            'is_required' => true,
        ]);

        AuditLog::log(
            action: 'CREATE_CATEGORY_DIMENSION',
            entityType: 'CategoryDimension',
            entityId: $dim->id,
            reason: "Menambahkan dimensi {$dim->name} ({$dim->code}) ke stream {$stream->name}"
        );

        return back()->with('success', "Dimensi kategori {$dim->name} berhasil ditambahkan.");
    }

    /**
     * Add option to a dimension.
     */
    public function storeOption(Request $request, CategoryDimension $dimension): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'abbreviation' => ['required', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
        ]);

        $option = $dimension->options()->create([
            'name' => trim($request->input('name')),
            'abbreviation' => strtoupper(trim($request->input('abbreviation'))),
            'sort_order' => $request->input('sort_order', 0),
            'quota' => $request->input('quota'),
        ]);

        AuditLog::log(
            action: 'CREATE_CATEGORY_OPTION',
            entityType: 'CategoryOption',
            entityId: $option->id,
            reason: "Menambahkan opsi {$option->name} ({$option->abbreviation}) pada dimensi {$dimension->name}"
        );

        return back()->with('success', "Opsi {$option->name} berhasil ditambahkan.");
    }

    /**
     * Update category option.
     */
    public function updateOption(Request $request, CategoryOption $option): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'abbreviation' => ['required', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
        ]);

        $option->update([
            'name' => trim($request->input('name')),
            'abbreviation' => strtoupper(trim($request->input('abbreviation'))),
            'sort_order' => $request->input('sort_order', 0),
            'quota' => $request->input('quota'),
        ]);

        return back()->with('success', "Opsi {$option->name} berhasil diperbarui.");
    }

    /**
     * Delete category option.
     */
    public function destroyOption(CategoryOption $option): RedirectResponse
    {
        $name = $option->name;
        $option->delete();

        return back()->with('success', "Opsi {$name} berhasil dihapus.");
    }
}
